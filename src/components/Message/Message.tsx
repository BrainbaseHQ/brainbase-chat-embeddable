import React from 'react';
import type { Message as MessageType } from '../../types';
import { BrainbaseLogo } from '../BrainbaseLogo';
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
              <BrainbaseLogo
                className={styles.brainbaseLogo}
                color="white"
                cutoutColor="var(--bb-primary-color)"
              />
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
