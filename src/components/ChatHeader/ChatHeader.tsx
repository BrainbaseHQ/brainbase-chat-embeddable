import React from 'react';
import styles from './ChatHeader.module.css';

export interface ChatHeaderProps {
  agentName?: string;
  agentLogoUrl?: string;
  welcomeTitle?: string;
  welcomeSubtitle?: string;
  onClose?: () => void;
  onNewChat?: () => void;
  showNewChatButton?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  agentName = 'AI Assistant',
  agentLogoUrl,
  welcomeTitle,
  welcomeSubtitle,
  onClose,
  onNewChat,
  showNewChatButton = false,
}) => {
  const displayTitle = welcomeTitle || `Hello there.`;
  const displaySubtitle = welcomeSubtitle || 'How can we help?';

  return (
    <div className={styles.header}>
      <div className={styles.headerBackground} />
      <div className={styles.headerContent}>
        <div className={styles.topRow}>
          <div className={styles.agentInfo}>
            {agentLogoUrl ? (
              <img
                src={agentLogoUrl}
                alt={agentName}
                className={styles.agentLogo}
              />
            ) : (
              <div className={styles.agentLogoPlaceholder}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9H15V22H13V16H11V22H9V9H3V7H21V9Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            )}
          </div>
          <div className={styles.actions}>
            {showNewChatButton && onNewChat && (
              <button
                className={styles.actionButton}
                onClick={onNewChat}
                aria-label="Start new chat"
                type="button"
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 5V19M5 12H19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            {onClose && (
              <button
                className={styles.actionButton}
                onClick={onClose}
                aria-label="Close chat"
                type="button"
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 18L18 6M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className={styles.welcomeText}>
          <h1 className={styles.title}>{displayTitle}</h1>
          <p className={styles.subtitle}>{displaySubtitle}</p>
        </div>
      </div>
    </div>
  );
};

