import React from 'react';
import { BrainbaseLogo } from '../BrainbaseLogo';
import styles from './TypingIndicator.module.css';

export interface TypingIndicatorProps {
  agentName?: string;
  agentLogoUrl?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  agentName = 'AI',
  agentLogoUrl,
}) => {
  return (
    <div className={styles.wrapper} role="status" aria-label={`${agentName} is typing`}>
      <div className={styles.avatar}>
        {agentLogoUrl ? (
          <img src={agentLogoUrl} alt={agentName} />
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
      <div className={styles.bubble}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </div>
  );
};
