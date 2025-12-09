import React from 'react';
import styles from './TypingIndicator.module.css';

export interface TypingIndicatorProps {
  agentName?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  agentName = 'AI',
}) => {
  return (
    <div className={styles.wrapper} role="status" aria-label={`${agentName} is typing`}>
      <div className={styles.indicator}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </div>
  );
};

