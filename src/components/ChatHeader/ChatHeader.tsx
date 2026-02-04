import React, { useState, useRef, useEffect } from 'react';
import { BrainbaseLogo } from '../BrainbaseLogo';
import styles from './ChatHeader.module.css';

export interface ChatHeaderProps {
  agentName?: string;
  agentLogoUrl?: string;
  /** Description shown below agent name (e.g., "The team can also help") */
  headerSubtitle?: string;
  welcomeTitle?: string;
  welcomeSubtitle?: string;
  onClose?: () => void;
  onBack?: () => void;
  onNewChatRequest?: () => void;
  onExpandWindow?: () => void;
  onDownloadTranscript?: () => void;
  showMenuButton?: boolean;
  /** Whether the widget is currently expanded */
  isExpanded?: boolean;
  /** When true, shows a compact header without welcome text */
  compact?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  agentName = 'AI Assistant',
  agentLogoUrl,
  headerSubtitle,
  welcomeTitle,
  welcomeSubtitle,
  onClose,
  onBack,
  onNewChatRequest,
  onExpandWindow,
  onDownloadTranscript,
  showMenuButton = false,
  isExpanded = false,
  compact = false,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Use provided values or defaults
  const displayTitle = welcomeTitle || 'Hello there.';
  // Only show default subtitle if no custom welcomeTitle was provided
  const displaySubtitle = welcomeSubtitle !== undefined 
    ? welcomeSubtitle 
    : (welcomeTitle ? undefined : 'How can we help?');

  const handleMenuItemClick = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };

  return (
    <div className={`${styles.header} ${compact ? styles.compact : ''}`}>
      <div className={styles.headerBackground} />
      <div className={styles.headerContent}>
        <div className={styles.topRow}>
          <div className={styles.agentInfo}>
            {/* Left chevron / back button */}
            <button
              className={styles.backButton}
              onClick={onBack}
              aria-label="Back"
              type="button"
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
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
            <div className={styles.agentTextWrapper}>
              <span className={styles.agentName}>{agentName}</span>
              {headerSubtitle && (
                <span className={styles.headerSubtitle}>{headerSubtitle}</span>
              )}
            </div>
          </div>
          <div className={styles.actions}>
            {showMenuButton && (
              <div className={styles.menuContainer} ref={menuRef}>
                <button
                  className={styles.actionButton}
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Open menu"
                  aria-expanded={isMenuOpen}
                  type="button"
                >
                  {/* Three dots icon (horizontal) */}
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                  </svg>
                </button>

                {isMenuOpen && (
                  <div className={styles.dropdown}>
                    {onExpandWindow && (
                      <button
                        className={styles.dropdownItem}
                        onClick={() => handleMenuItemClick(onExpandWindow)}
                        type="button"
                      >
                        {isExpanded ? (
                          <>
                            {/* Minimize icon */}
                            <svg viewBox="0 0 24 24" fill="none" className={styles.dropdownIcon}>
                              <path
                                d="M4 14H10V20M10 14L3 21M20 10H14V4M14 10L21 3"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span>Minimize</span>
                          </>
                        ) : (
                          <>
                            {/* Expand icon */}
                            <svg viewBox="0 0 24 24" fill="none" className={styles.dropdownIcon}>
                              <path
                                d="M15 3H21V9M21 3L13 11M9 21H3V15M3 21L11 13"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span>Expand window</span>
                          </>
                        )}
                      </button>
                    )}
                    {onDownloadTranscript && (
                      <button
                        className={styles.dropdownItem}
                        onClick={() => handleMenuItemClick(onDownloadTranscript)}
                        type="button"
                      >
                        {/* Download icon */}
                        <svg viewBox="0 0 24 24" fill="none" className={styles.dropdownIcon}>
                          <path
                            d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15M7 10L12 15M12 15L17 10M12 15V3"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span>Download transcript</span>
                      </button>
                    )}
                    {onNewChatRequest && (
                      <button
                        className={styles.dropdownItem}
                        onClick={() => handleMenuItemClick(onNewChatRequest)}
                        type="button"
                      >
                        {/* Plus icon */}
                        <svg viewBox="0 0 24 24" fill="none" className={styles.dropdownIcon}>
                          <path
                            d="M12 5V19M5 12H19"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span>New chat</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
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
