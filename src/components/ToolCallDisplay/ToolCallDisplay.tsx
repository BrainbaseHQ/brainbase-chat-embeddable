import React from 'react';
import type { ToolCall } from '../../types';
import styles from './ToolCallDisplay.module.css';

export interface ToolCallDisplayProps {
  toolCall: ToolCall;
}

export const ToolCallDisplay: React.FC<ToolCallDisplayProps> = ({ toolCall }) => {
  const isPending = toolCall.status === 'pending' || toolCall.status === 'executing';
  const isCompleted = toolCall.status === 'completed';
  const isError = toolCall.status === 'error';

  // Format the tool name for display
  const formatToolName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .toLowerCase()
      .replace(/^./, (str) => str.toUpperCase());
  };

  return (
    <div
      className={`${styles.toolCall} ${isPending ? styles.pending : ''} ${isCompleted ? styles.completed : ''} ${isError ? styles.error : ''}`}
    >
      <div className={styles.iconWrapper}>
        {isPending ? (
          <div className={styles.spinner} />
        ) : isCompleted ? (
          <svg viewBox="0 0 24 24" fill="none" className={styles.checkIcon}>
            <path
              d="M20 6L9 17L4 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" className={styles.errorIcon}>
            <path
              d="M6 18L18 6M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <div className={styles.content}>
        <span className={styles.label}>
          {isPending ? 'Running' : isCompleted ? 'Completed' : 'Failed'}
        </span>
        <span className={styles.name}>{formatToolName(toolCall.name)}</span>
      </div>
    </div>
  );
};

