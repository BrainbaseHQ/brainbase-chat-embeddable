import React from 'react';
import { BrainbaseLogo } from '../BrainbaseLogo';
import styles from './ChatHeader.module.css';

export interface ChatHeaderProps {
  agentName?: string;
  agentLogoUrl?: string;
  welcomeTitle?: string;
  welcomeSubtitle?: string;
  onClose?: () => void;
  onNewChatRequest?: () => void;
  showNewChatButton?: boolean;
  /** When true, shows a compact header without welcome text */
  compact?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  agentName = 'AI Assistant',
  agentLogoUrl,
  welcomeTitle,
  welcomeSubtitle,
  onClose,
  onNewChatRequest,
  showNewChatButton = false,
  compact = false,
}) => {
  // Use provided values or defaults
  const displayTitle = welcomeTitle || 'Hello there.';
  // Only show default subtitle if no custom welcomeTitle was provided
  const displaySubtitle = welcomeSubtitle !== undefined 
    ? welcomeSubtitle 
    : (welcomeTitle ? undefined : 'How can we help?');

  return (
    <div className={`${styles.header} ${compact ? styles.compact : ''}`}>
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
                <BrainbaseLogo
                  className={styles.brainbaseLogo}
                  color="white"
                  cutoutColor="var(--bb-primary-color)"
                />
              </div>
            )}
            <span className={styles.agentName}>{agentName}</span>
          </div>
          <div className={styles.actions}>
            {showNewChatButton && onNewChatRequest && (
              <button
                className={styles.actionButton}
                onClick={onNewChatRequest}
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
        {!compact && (
          <div className={styles.welcomeText}>
            <h1 className={styles.title}>{displayTitle}</h1>
            {displaySubtitle && <p className={styles.subtitle}>{displaySubtitle}</p>}
          </div>
        )}
      </div>
    </div>
  );
};
