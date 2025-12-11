import React, { useState } from 'react';
import type { DeploymentConfig, Message, ToolCall } from '../../types';
import { ChatHeader } from '../ChatHeader';
import { MessageList } from '../MessageList';
import { MessageInput } from '../MessageInput';
import { PoweredBy } from '../PoweredBy';
import styles from './ChatContainer.module.css';

export interface ChatContainerProps {
  config: DeploymentConfig;
  messages: Message[];
  toolCalls?: ToolCall[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onClose?: () => void;
  onNewChat?: () => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  config,
  messages,
  toolCalls = [],
  isLoading,
  onSendMessage,
  onClose,
  onNewChat,
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const hasMessages = messages.length > 0;

  const handleNewChatRequest = () => {
    setShowConfirmation(true);
  };

  const handleConfirmNewChat = () => {
    setShowConfirmation(false);
    onNewChat?.();
  };

  const handleCancelNewChat = () => {
    setShowConfirmation(false);
  };

  return (
    <div className={styles.container} role="dialog" aria-label="Chat window">
      <ChatHeader
        agentName={config.agentName}
        agentLogoUrl={config.agentLogoUrl}
        welcomeTitle={config.welcomeMessage || "Hello there."}
        welcomeSubtitle={config.welcomeMessage ? undefined : "How can we help?"}
        onClose={onClose}
        onNewChatRequest={handleNewChatRequest}
        showNewChatButton={hasMessages}
        compact={hasMessages}
      />
      <div className={styles.body}>
        <MessageList
          messages={messages}
          toolCalls={toolCalls}
          isLoading={isLoading}
          agentName={config.agentName}
          agentLogoUrl={config.agentLogoUrl}
        />
        <MessageInput
          onSend={onSendMessage}
          disabled={isLoading}
          placeholder="Ask a question..."
        />
      </div>
      <PoweredBy showBranding={(config.styling?.showBranding as boolean) ?? true} />

      {/* Confirmation dialog - positioned at container level to overlay entire widget */}
      {showConfirmation && (
        <div className={styles.confirmationOverlay}>
          <div className={styles.confirmationDialog}>
            <p className={styles.confirmationText}>
              End current chat and start a new conversation?
            </p>
            <div className={styles.confirmationButtons}>
              <button
                className={styles.cancelButton}
                onClick={handleCancelNewChat}
                type="button"
              >
                Cancel
              </button>
              <button
                className={styles.confirmButton}
                onClick={handleConfirmNewChat}
                type="button"
              >
                End Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
