import React from 'react';
import { MessageCircle } from 'lucide-react';
import { getIconByName, isValidIconName } from '../../utils/icons';
import styles from './ChatToggleButton.module.css';

export interface ChatToggleButtonProps {
  onClick: () => void;
  agentName?: string;
  agentLogoUrl?: string;
  unreadCount?: number;
  /** Custom icon - can be a Lucide icon name (string), image URL, or React node */
  customIcon?: string | React.ReactNode;
}

export const ChatToggleButton: React.FC<ChatToggleButtonProps> = ({
  onClick,
  agentLogoUrl,
  unreadCount = 0,
  customIcon,
}) => {
  // Render the icon based on priority: customIcon > agentLogoUrl > default
  const renderIcon = () => {
    if (customIcon) {
      if (typeof customIcon === 'string') {
        // Check if it's a known icon name
        if (isValidIconName(customIcon)) {
          return <span className={styles.customIcon}>{getIconByName(customIcon)}</span>;
        }
        // Otherwise treat it as an image URL
        return <img src={customIcon} alt="" className={styles.agentLogo} />;
      }
      // React node (e.g., direct Lucide component)
      return <span className={styles.customIcon}>{customIcon}</span>;
    }
    
    if (agentLogoUrl) {
      return <img src={agentLogoUrl} alt="" className={styles.agentLogo} />;
    }
    
    // Default chat icon (using Lucide)
    return <MessageCircle className={styles.icon} />;
  };

  return (
    <button
      className={styles.toggleButton}
      onClick={onClick}
      aria-label="Open chat"
      type="button"
    >
      {renderIcon()}
      {unreadCount > 0 && (
        <span className={styles.unreadBadge}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

