import React from 'react';
import type { Message as MessageType } from '../../types';
import styles from './Message.module.css';

export interface MessageProps {
  message: MessageType;
  agentName?: string;
  agentLogoUrl?: string;
}

export const Message: React.FC<MessageProps> = ({
  message,
  agentName,
  agentLogoUrl,
}) => {
  const isUser = message.role === 'user';
  const isStreaming = message.status === 'streaming';
  const isError = message.status === 'error';

  return (
    <div
      className={`${styles.messageWrapper} ${isUser ? styles.user : styles.assistant}`}
    >
      {!isUser && (
        <div className={styles.avatar}>
          {agentLogoUrl ? (
            <img src={agentLogoUrl} alt={agentName || 'AI'} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          )}
        </div>
      )}
      <div
        className={`${styles.messageBubble} ${isError ? styles.error : ''}`}
        role="article"
        aria-label={`${isUser ? 'Your message' : `${agentName || 'AI'} says`}`}
      >
        <div className={styles.content}>
          {message.content}
          {isStreaming && <span className={styles.cursor} />}
        </div>
        {isError && (
          <div className={styles.errorIndicator}>
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>Failed to send</span>
          </div>
        )}
      </div>
    </div>
  );
};

