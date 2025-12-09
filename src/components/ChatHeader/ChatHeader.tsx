import React, { useState } from 'react';
import styles from './ChatHeader.module.css';

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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const displayTitle = welcomeTitle || `Hello there.`;
  const displaySubtitle = welcomeSubtitle || 'How can we help?';

  const handleNewChatClick = () => {
    if (showNewChatButton) {
      setShowConfirmation(true);
    }
  };

  const handleConfirmNewChat = () => {
    setShowConfirmation(false);
    onNewChat?.();
  };

  const handleCancelNewChat = () => {
    setShowConfirmation(false);
  };

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
                <BrainbaseLogo className={styles.brainbaseLogo} />
              </div>
            )}
            <span className={styles.agentName}>{agentName}</span>
          </div>
          <div className={styles.actions}>
            {showNewChatButton && onNewChat && (
              <button
                className={styles.actionButton}
                onClick={handleNewChatClick}
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

      {/* Confirmation dialog for ending chat */}
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

