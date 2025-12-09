import React, { useState, useEffect, useMemo } from 'react';
import type { ChatWidgetProps, DeploymentConfig } from '../../types';
import { useChat } from '../../hooks/useChat';
import { createAPIClient } from '../../api/client';
import { createMockAPIClient } from '../../api/mock';
import { ChatContainer } from '../ChatContainer';
import { ChatToggleButton } from '../ChatToggleButton';
import styles from './ChatWidget.module.css';

const DEFAULT_ENGINE_URL = 'https://whatsapp-based-server.onrender.com';

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
  className,
  onSessionStart,
  onSessionEnd,
  onMessage,
  onError,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [config, setConfig] = useState<DeploymentConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState<Error | null>(null);

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
  useEffect(() => {
    let mounted = true;

    async function fetchConfig() {
      try {
        const deploymentConfig = await apiClient.getDeploymentConfig(embedId);
        if (mounted) {
          setConfig({
            ...deploymentConfig,
            // Allow prop overrides
            primaryColor: primaryColor ?? deploymentConfig.primaryColor,
            agentName: agentName ?? deploymentConfig.agentName,
            welcomeMessage: welcomeMessage ?? deploymentConfig.welcomeMessage,
          });
          setConfigError(null);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load config');
        if (mounted) {
          setConfigError(error);
          // In mock mode, use default config on error
          if (mockMode) {
            setConfig({
              embedId,
              deploymentId: 'mock-deployment',
              workerId: 'mock-worker',
              flowId: 'mock-flow',
              primaryColor: primaryColor ?? '#1a1a2e',
              agentName: agentName ?? 'AI Assistant',
              // Note: welcomeMessage is handled by the engine
            });
          }
        }
        onError?.(error);
      } finally {
        if (mounted) setIsLoadingConfig(false);
      }
    }

    fetchConfig();
    return () => {
      mounted = false;
    };
  }, [embedId, mockMode, apiClient, primaryColor, agentName, welcomeMessage, onError]);

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
    };
  }, [config, embedId, primaryColor, agentName, welcomeMessage]);

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

  // Don't render anything while loading (unless in mock mode with error)
  if (isLoadingConfig) {
    return null;
  }

  // Show error state only if not in mock mode
  if (configError && !mockMode) {
    return null;
  }

  const isInline = position === 'inline';

  return (
    <div
      className={`${styles.widget} ${styles[position]} ${className ?? ''}`}
      style={themeStyle}
    >
      {isOpen || isInline ? (
        <ChatContainer
          config={chatConfig}
          messages={chat.messages}
          toolCalls={chat.toolCalls}
          isLoading={chat.isLoading}
          onSendMessage={chat.sendMessage}
          onClose={isInline ? undefined : () => setIsOpen(false)}
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

