import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  welcomeMessage,
  showBranding,
  className,
  onSessionStart,
  onSessionEnd,
  onMessage,
  onError,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [config, setConfig] = useState<DeploymentConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  // Create API client based on mode
  const apiClient = useMemo(() => {
    if (mockMode) {
      return createMockAPIClient(
        { primaryColor, agentName, welcomeMessage },
        mockResponses
      );
    }
    return createAPIClient(apiBaseUrl);
  }, [mockMode, primaryColor, agentName, welcomeMessage, mockResponses, apiBaseUrl]);

  // Fetch deployment config
  const fetchConfig = useCallback(async () => {
    setIsLoadingConfig(true);
    setErrorType(null);
    setErrorMessage(undefined);

    try {
      const deploymentConfig = await apiClient.getDeploymentConfig(embedId);
      setConfig({
        ...deploymentConfig,
        // Allow prop overrides
        primaryColor: primaryColor ?? deploymentConfig.primaryColor,
        agentName: agentName ?? deploymentConfig.agentName,
        welcomeMessage: welcomeMessage ?? deploymentConfig.welcomeMessage,
        styling: {
          ...(deploymentConfig.styling ?? {}),
          ...(showBranding !== undefined ? { showBranding } : {}),
        },
      });
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
        setConfig({
          embedId,
          deploymentId: 'mock-deployment',
          workerId: 'mock-worker',
          flowId: 'mock-flow',
          primaryColor: primaryColor ?? '#1a1a2e',
          agentName: agentName ?? 'AI Assistant',
          styling: showBranding !== undefined ? { showBranding } : undefined,
        });
        setErrorType(null);
      }

      onError?.(error);
    } finally {
      setIsLoadingConfig(false);
    }
  }, [embedId, mockMode, apiClient, primaryColor, agentName, welcomeMessage, onError]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Create a stable config for useChat
  const chatConfig = useMemo((): DeploymentConfig => {
    if (config) return config;
    return {
      embedId,
      deploymentId: '',
      workerId: '',
      flowId: '',
      primaryColor,
      agentName,
      welcomeMessage,
      styling:
        showBranding !== undefined
          ? {
              showBranding,
            }
          : undefined,
    };
  }, [config, embedId, primaryColor, agentName, welcomeMessage, showBranding]);

  const chat = useChat({
    config: chatConfig,
    apiClient,
    mockMode,
    onSessionStart,
    onSessionEnd,
    onMessage,
    onError,
  });

  // CSS custom properties for theming
  const themeStyle = useMemo(
    () =>
      ({
        '--bb-primary-color': config?.primaryColor ?? primaryColor ?? '#1a1a2e',
      }) as React.CSSProperties,
    [config?.primaryColor, primaryColor]
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
          config={chatConfig}
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
          agentName={config?.agentName}
          agentLogoUrl={config?.agentLogoUrl}
        />
      )}
    </div>
  );
};
