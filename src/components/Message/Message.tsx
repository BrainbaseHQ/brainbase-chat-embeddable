import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Message as MessageType } from '../../types';
import styles from './Message.module.css';

export interface MessageProps {
  message: MessageType;
  agentName?: string;
  agentRole?: string;
  isLastAssistantMessage?: boolean;
}

// Format relative time (e.g., "2m", "1h", "Just now")
const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
};

export const Message: React.FC<MessageProps> = ({
  message,
  agentName,
  agentRole,
  isLastAssistantMessage = false,
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  
  const isUser = message.role === 'user';
  const isStreaming = message.status === 'streaming';
  const isError = message.status === 'error';
  const isAssistant = message.role === 'assistant';

  // Determine if info should be shown
  const shouldShowInfo = isAssistant && (isLastAssistantMessage || showInfo);

  // Handle visibility with animation
  useEffect(() => {
    if (shouldShowInfo && !isVisible) {
      setIsAnimatingOut(false);
      setIsVisible(true);
    } else if (!shouldShowInfo && isVisible) {
      setIsAnimatingOut(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsAnimatingOut(false);
      }, 200); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [shouldShowInfo, isVisible]);

  const handleMessageClick = () => {
    if (isAssistant && !isLastAssistantMessage) {
      setShowInfo(!showInfo);
    }
  };

  const messageWrapperClasses = [
    styles.messageWrapper,
    isUser ? styles.user : styles.assistant,
    isAssistant && !isLastAssistantMessage ? styles.clickable : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={messageWrapperClasses} onClick={handleMessageClick}>
      <div className={styles.messageContent}>
        <div
          className={`${styles.messageBubble} ${isError ? styles.error : ''}`}
          role="article"
          aria-label={`${isUser ? 'Your message' : `${agentName || 'AI'} says`}`}
        >
          <div className={`${styles.content} ${!isUser ? styles.markdown : ''}`}>
            {isUser ? (
              message.content
            ) : (
              <ReactMarkdown
                components={{
                  a: ({ href, children }) =>
                    href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ) : (
                      <>{children}</>
                    ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
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
        {isVisible && (
          <div className={`${styles.messageInfo} ${isAnimatingOut ? styles.fadeOut : ''}`}>
            <span className={styles.agentName}>{agentName || 'AI'}</span>
            {agentRole && (
              <>
                <span className={styles.separator}>•</span>
                <span className={styles.agentRole}>{agentRole}</span>
              </>
            )}
            <span className={styles.separator}>•</span>
            <span className={styles.timestamp}>{formatRelativeTime(message.timestamp)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
