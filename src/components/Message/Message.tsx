import React from 'react';
import type { Message as MessageType } from '../../types';
import styles from './Message.module.css';

// Brainbase Labs logo - used as default avatar
const BrainbaseLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 800 800"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M400 412C400 405.373 405.373 400 412 400H788C794.627 400 800 405.373 800 412V740C800 773.137 773.137 800 740 800H412C405.373 800 400 794.627 400 788V412Z"
      fill="currentColor"
    />
    <circle cx="400" cy="400" r="400" fill="currentColor" />
    <path
      d="M0 60C0 26.8629 26.8629 0 60 0H397.614C398.932 0 400 1.06811 400 2.38569V2.38569C400 221.982 221.982 400 2.38569 400V400C1.06811 400 0 398.932 0 397.614V60Z"
      fill="currentColor"
    />
    <path
      d="M400 412C400 405.373 405.373 400 412 400H738C744.627 400 750 405.373 750 412V725C750 738.807 738.807 750 725 750H412C405.373 750 400 744.627 400 738V412Z"
      fill="currentColor"
    />
    <circle cx="400" cy="400" r="350" fill="currentColor" />
    <path
      d="M50 75C50 61.1929 61.1929 50 75 50H388C394.627 50 400 55.3726 400 62V388C400 394.627 394.627 400 388 400H62C55.3726 400 50 394.627 50 388V75Z"
      fill="currentColor"
    />
    <rect
      x="399.919"
      y="209"
      width="270"
      height="270"
      rx="12"
      transform="rotate(45 399.919 209)"
      fill="white"
    />
  </svg>
);

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
              <BrainbaseLogo className={styles.brainbaseLogo} />
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

