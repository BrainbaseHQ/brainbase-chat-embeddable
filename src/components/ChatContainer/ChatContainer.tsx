import React from 'react';
import type { DeploymentConfig, Message, ToolCall } from '../../types';
import { ChatHeader } from '../ChatHeader';
import { MessageList } from '../MessageList';
import { MessageInput } from '../MessageInput';
import styles from './ChatContainer.module.css';

export interface ChatContainerProps {
  config: DeploymentConfig;
  messages: Message[];
  toolCalls: ToolCall[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onClose?: () => void;
  onNewChat?: () => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  config,
  messages,
  toolCalls,
  isLoading,
  onSendMessage,
  onClose,
  onNewChat,
}) => {
  const hasMessages = messages.length > 0;

  return (
    <div className={styles.container} role="dialog" aria-label="Chat window">
      <ChatHeader
        agentName={config.agentName}
        agentLogoUrl={config.agentLogoUrl}
        welcomeTitle="Hello there."
        welcomeSubtitle="How can we help?"
        onClose={onClose}
        onNewChat={onNewChat}
        showNewChatButton={hasMessages}
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
    </div>
  );
};

