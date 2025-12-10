import React from 'react';
import { BrainbaseLogo } from '../BrainbaseLogo';
import styles from './ErrorState.module.css';

export interface ErrorStateProps {
  /** The type of error that occurred */
  errorType: 'not_found' | 'network' | 'unknown';
  /** Optional custom message to display */
  message?: string;
  /** Callback to retry loading */
  onRetry?: () => void;
  /** Callback to close the widget */
  onClose?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  errorType,
  message,
  onRetry,
  onClose,
}) => {
  const getErrorContent = () => {
    switch (errorType) {
      case 'not_found':
        return {
          title: 'Chat Not Found',
          description:
            message ||
            'This chat widget is not configured correctly. Please check the embed ID.',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" className={styles.errorIcon}>
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M12 7V13M12 16V16.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          ),
        };
      case 'network':
        return {
          title: 'Connection Error',
          description:
            message ||
            'Unable to connect to the chat service. Please check your internet connection.',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" className={styles.errorIcon}>
              <path
                d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M8 15L16 9M8 9L16 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          ),
        };
      default:
        return {
          title: 'Something Went Wrong',
          description:
            message || 'An unexpected error occurred. Please try again later.',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" className={styles.errorIcon}>
              <path
                d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          ),
        };
    }
  };

  const { title, description, icon } = getErrorContent();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.logoWrapper}>
          <BrainbaseLogo
            className={styles.logo}
            color="white"
            cutoutColor="var(--bb-primary-color)"
          />
        </div>
        {onClose && (
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M6 18L18 6M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.iconWrapper}>{icon}</div>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>

        {onRetry && (
          <button className={styles.retryButton} onClick={onRetry} type="button">
            Try Again
          </button>
        )}
      </div>

      <div className={styles.footer}>
        <a
          href="https://brainbaselabs.com"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.poweredBy}
        >
          Powered by{' '}
          <BrainbaseLogo
            className={styles.footerLogo}
            color="var(--bb-text-tertiary)"
            cutoutColor="var(--bb-surface-bg)"
          />
          <span>Brainbase Labs</span>
        </a>
      </div>
    </div>
  );
};

