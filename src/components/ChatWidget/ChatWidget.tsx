import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { ChatWidgetProps, DeploymentConfig } from '../../types';
import { useChat } from '../../hooks/useChat';
import { createAPIClient } from '../../api/client';
import { createMockAPIClient } from '../../api/mock';
import { ChatContainer } from '../ChatContainer';
import { ChatToggleButton } from '../ChatToggleButton';
import { ErrorState } from '../ErrorState';
import styles from './ChatWidget.module.css';
import { DEFAULT_ENGINE_URL } from '../../api/client';

type ErrorType = 'not_found' | 'network' | 'unknown' | null;

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  embedId,
  apiBaseUrl = DEFAULT_ENGINE_URL,
  mockMode = false,
  mockResponses,
  position = 'bottom-right',
  defaultOpen = false,
  primaryColor,
  agentName,
  agentLogoUrl,
  welcomeMessage,
  showBranding,
  className,
  onSessionStart,
  onSessionEnd,
  onMessage,
  onError,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [baseConfig, setBaseConfig] = useState<DeploymentConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  
  // Track if initial config has been loaded to prevent re-renders
  const hasLoadedConfig = useRef(false);

  // Create API client based on mode - NOT dependent on styling props
  const apiClient = useMemo(() => {
    if (mockMode) {
      // Pass empty config to mock client - we'll apply overrides via effectiveConfig
      return createMockAPIClient({}, mockResponses);
    }
    return createAPIClient(apiBaseUrl);
  }, [mockMode, mockResponses, apiBaseUrl]);

  // Fetch deployment config - only when embedId or mockMode changes
  const fetchConfig = useCallback(async () => {
    // Skip if already loaded and not a forced refresh
    if (hasLoadedConfig.current && baseConfig) {
      return;
    }
    
    setIsLoadingConfig(true);
    setErrorType(null);
    setErrorMessage(undefined);

    try {
      const deploymentConfig = await apiClient.getDeploymentConfig(embedId);
      setBaseConfig(deploymentConfig);
      hasLoadedConfig.current = true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load config');
      
      // Determine error type
      if (error.message.includes('404')) {
        setErrorType('not_found');
        setErrorMessage('The chat widget with this embed ID was not found.');
      } else if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
        setErrorType('network');
      } else {
        setErrorType('unknown');
      }

      // In mock mode, use default config on error
      if (mockMode) {
        setBaseConfig({
          embedId,
          deploymentId: 'mock-deployment',
          workerId: 'mock-worker',
          flowId: 'mock-flow',
          primaryColor: '#1a1a2e',
          agentName: 'AI Assistant',
          styling: {},
        });
        setErrorType(null);
        hasLoadedConfig.current = true;
      }

      onError?.(error);
    } finally {
      setIsLoadingConfig(false);
    }
  }, [embedId, mockMode, apiClient, onError, baseConfig]);

  // Only fetch on mount or when embedId changes
  useEffect(() => {
    hasLoadedConfig.current = false;
    fetchConfig();
  }, [embedId, mockMode, apiClient]);

  // Effective config: base config + prop overrides (updates instantly without re-fetch)
  const effectiveConfig = useMemo((): DeploymentConfig => {
    const base = baseConfig ?? {
      embedId,
      deploymentId: '',
      workerId: '',
      flowId: '',
    };
    
    return {
      ...base,
      // Apply prop overrides - these update instantly without triggering re-fetch
      primaryColor: primaryColor ?? base.primaryColor ?? '#1a1a2e',
      agentName: agentName ?? base.agentName,
      agentLogoUrl: agentLogoUrl ?? base.agentLogoUrl,
      welcomeMessage: welcomeMessage ?? base.welcomeMessage,
      styling: {
        ...(base.styling ?? {}),
        ...(showBranding !== undefined ? { showBranding } : {}),
      },
    };
  }, [baseConfig, embedId, primaryColor, agentName, agentLogoUrl, welcomeMessage, showBranding]);

  const chat = useChat({
    config: effectiveConfig,
    apiClient,
    mockMode,
    onSessionStart,
    onSessionEnd,
    onMessage,
    onError,
  });

  // CSS custom properties for theming - uses effectiveConfig for instant updates
  const themeStyle = useMemo(
    () =>
      ({
        '--bb-primary-color': effectiveConfig.primaryColor ?? '#1a1a2e',
      }) as React.CSSProperties,
    [effectiveConfig.primaryColor]
  );

  // Handle new chat
  const handleNewChat = () => {
    chat.endSession();
    chat.startNewSession();
  };

  // Handle close
  const handleClose = () => {
    setIsOpen(false);
  };

  // Handle retry
  const handleRetry = () => {
    fetchConfig();
  };

  const isInline = position === 'inline';

  // Don't render anything while loading
  if (isLoadingConfig) {
    return null;
  }

  // Show error state when there's an error
  if (errorType && !mockMode) {
    // For non-inline position, only show error when widget is open
    if (!isInline && !isOpen) {
      return (
        <div
          className={`${styles.widget} ${styles[position]} ${className ?? ''}`}
          style={themeStyle}
        >
          <ChatToggleButton
            onClick={() => setIsOpen(true)}
            agentName={agentName}
          />
        </div>
      );
    }

    return (
      <div
        className={`${styles.widget} ${styles[position]} ${className ?? ''}`}
        style={themeStyle}
      >
        <ErrorState
          errorType={errorType}
          message={errorMessage}
          onRetry={handleRetry}
          onClose={isInline ? undefined : handleClose}
        />
      </div>
    );
  }

  return (
    <div
      className={`${styles.widget} ${styles[position]} ${className ?? ''}`}
      style={themeStyle}
    >
      {isOpen || isInline ? (
        <ChatContainer
          config={effectiveConfig}
          messages={chat.messages}
          // toolCalls={chat.toolCalls} // Disabled tool running UI
          isLoading={chat.isLoading}
          onSendMessage={chat.sendMessage}
          onClose={isInline ? undefined : handleClose}
          onNewChat={handleNewChat}
        />
      ) : (
        <ChatToggleButton
          onClick={() => setIsOpen(true)}
          agentName={effectiveConfig.agentName}
          agentLogoUrl={effectiveConfig.agentLogoUrl}
        />
      )}
    </div>
  );
};
