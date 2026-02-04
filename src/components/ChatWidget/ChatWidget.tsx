import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { ChatWidgetProps, DeploymentConfig } from '../../types';
import { useChat } from '../../hooks/useChat';
import { createAPIClient } from '../../api/client';
import { createMockAPIClient } from '../../api/mock';
import { ChatContainer } from '../ChatContainer';
import { ChatToggleButton } from '../ChatToggleButton';
import { ErrorState } from '../ErrorState';
import { HomePage } from '../HomePage';
import styles from './ChatWidget.module.css';
import { DEFAULT_ENGINE_URL } from '../../api/client';

type ViewType = 'home' | 'chat';

type ErrorType = 'not_found' | 'network' | 'unknown' | null;

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  embedId,
  apiBaseUrl = DEFAULT_ENGINE_URL,
  mockMode = false,
  mockResponses,
  position = 'bottom-right',
  defaultOpen = false,
  primaryColor,
  accentColor,
  primaryGradient = false,
  accentGradient = false,
  headerTextColor,
  streamMessages = false,
  artificialDelay,
  homeImage,
  homeTitle,
  homeDescription,
  timeToOpen,
  agentName,
  agentRole,
  headerSubtitle,
  agentLogoUrl,
  agentNameFontSize = 16,
  toggleIcon,
  welcomeMessage,
  showBranding,
  width = 440,
  height = 720,
  expandedWidth = 640,
  expandedHeight = 800,
  messageFontSize = 15,
  theme = 'light',
  className,
  onSessionStart,
  onSessionEnd,
  onMessage,
  onError,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('chat');
  const [baseConfig, setBaseConfig] = useState<DeploymentConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  
  // Track if initial config has been loaded to prevent re-renders
  const hasLoadedConfig = useRef(false);
  
  // Track if auto-open has already triggered
  const hasAutoOpened = useRef(false);

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
      agentRole: agentRole ?? base.agentRole,
      agentLogoUrl: agentLogoUrl ?? base.agentLogoUrl,
      welcomeMessage: welcomeMessage ?? base.welcomeMessage,
      styling: {
        ...(base.styling ?? {}),
        ...(showBranding !== undefined ? { showBranding } : {}),
      },
    };
  }, [baseConfig, embedId, primaryColor, agentName, agentRole, agentLogoUrl, welcomeMessage, showBranding]);

  const chat = useChat({
    config: effectiveConfig,
    apiClient,
    mockMode,
    streamMessages,
    artificialDelay,
    onSessionStart,
    onSessionEnd,
    onMessage,
    onError,
  });

  // Auto-open timer: opens the widget and sends a trigger message after timeToOpen seconds
  useEffect(() => {
    // Don't set timer if:
    // - timeToOpen is not set
    // - already auto-opened
    // - widget is already open
    // - config is still loading
    if (!timeToOpen || hasAutoOpened.current || isOpen || isLoadingConfig) {
      return;
    }

    const timer = setTimeout(() => {
      if (!hasAutoOpened.current && !isOpen) {
        hasAutoOpened.current = true;
        setIsOpen(true);
        setCurrentView('chat');
        // Send a trigger message to start the conversation
        chat.sendTriggerMessage();
      }
    }, timeToOpen * 1000);

    return () => clearTimeout(timer);
  }, [timeToOpen, isOpen, isLoadingConfig, chat]);

  // CSS custom properties for theming and dimensions
  const effectiveAccentColor = accentColor ?? effectiveConfig.primaryColor ?? '#1a1a2e';
  
  // Default header text color based on theme
  const defaultHeaderTextColor = theme === 'granite' ? '#9ca3af' : '#000000';
  const effectiveHeaderTextColor = headerTextColor ?? defaultHeaderTextColor;
  
  const themeStyle = useMemo(
    () =>
      ({
        '--bb-primary-color': effectiveConfig.primaryColor ?? '#1a1a2e',
        '--bb-accent-color-custom': effectiveAccentColor,
        '--bb-primary-gradient': primaryGradient ? '1' : '0',
        '--bb-accent-gradient': accentGradient ? '1' : '0',
        '--bb-header-text-color': effectiveHeaderTextColor,
        '--bb-widget-width': isExpanded ? `${expandedWidth}px` : `${width}px`,
        '--bb-widget-height': isExpanded ? `${expandedHeight}px` : `${height}px`,
        '--bb-message-font-size': `${messageFontSize}px`,
        '--bb-agent-name-font-size': `${agentNameFontSize}px`,
      }) as React.CSSProperties,
    [effectiveConfig.primaryColor, effectiveAccentColor, primaryGradient, accentGradient, effectiveHeaderTextColor, isExpanded, width, height, expandedWidth, expandedHeight, messageFontSize, agentNameFontSize]
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

  // Handle expand window toggle
  const handleExpandWindow = () => {
    setIsExpanded(!isExpanded);
  };

  // Handle navigation between views
  const handleNavigate = (page: 'home' | 'messages') => {
    if (page === 'messages') {
      setCurrentView('chat');
    } else {
      setCurrentView(page);
    }
  };

  // Handle back button (go to home)
  const handleBack = () => {
    setCurrentView('home');
  };

  // Handle start chat from home page
  const handleStartChat = () => {
    setCurrentView('chat');
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
          data-bb-theme={theme}
        >
          <ChatToggleButton
            onClick={() => setIsOpen(true)}
            agentName={agentName}
            customIcon={toggleIcon}
          />
        </div>
      );
    }

    return (
      <div
        className={`${styles.widget} ${styles[position]} ${className ?? ''}`}
        style={themeStyle}
        data-bb-theme={theme}
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

  const widgetClasses = [
    styles.widget,
    styles[position],
    className ?? '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={widgetClasses}
      style={themeStyle}
      data-bb-theme={theme}
    >
      {isOpen || isInline ? (
        <div className={styles.openContainer}>
          {currentView === 'home' ? (
            <HomePage
              agentName={effectiveConfig.agentName}
              agentLogoUrl={effectiveConfig.agentLogoUrl}
              homeImage={homeImage}
              homeTitle={homeTitle}
              homeDescription={homeDescription}
              onStartChat={handleStartChat}
              onNavigate={handleNavigate}
              currentPage="home"
            />
          ) : (
            <ChatContainer
              config={effectiveConfig}
              messages={chat.messages}
              // toolCalls={chat.toolCalls} // Disabled tool running UI
              isLoading={chat.isLoading}
              showTypingIndicator={chat.showTypingIndicator}
              isExpanded={isExpanded}
              headerSubtitle={headerSubtitle}
              onSendMessage={chat.sendMessage}
              onClose={isInline ? undefined : handleClose}
              onBack={handleBack}
              onNewChat={handleNewChat}
              onExpandWindow={!isInline ? handleExpandWindow : undefined}
            />
          )}
          {/* Collapse button below chat */}
          {!isInline && (
            <button
              className={styles.collapseButton}
              onClick={handleClose}
              aria-label="Close chat"
              type="button"
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 9L12 15L18 9"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <ChatToggleButton
          onClick={() => setIsOpen(true)}
          agentName={effectiveConfig.agentName}
          agentLogoUrl={effectiveConfig.agentLogoUrl}
          customIcon={toggleIcon}
        />
      )}
    </div>
  );
};
