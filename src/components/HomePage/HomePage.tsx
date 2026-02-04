import React from 'react';
import { BrainbaseLogo } from '../BrainbaseLogo';
import styles from './HomePage.module.css';

export interface HomePageProps {
  agentName?: string;
  agentLogoUrl?: string;
  homeImage?: string;
  homeTitle?: string;
  homeDescription?: string;
  onStartChat: () => void;
  onNavigate: (page: 'home' | 'messages') => void;
  currentPage: 'home' | 'messages';
}

export const HomePage: React.FC<HomePageProps> = ({
  agentName = 'AI Assistant',
  agentLogoUrl,
  homeImage,
  homeTitle,
  homeDescription,
  onStartChat,
  onNavigate,
  currentPage,
}) => {
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerBackground} />
        <div className={styles.headerContent}>
          <div className={styles.agentInfo}>
            {agentLogoUrl ? (
              <img src={agentLogoUrl} alt={agentName} className={styles.headerLogo} />
            ) : (
              <div className={styles.headerLogoPlaceholder}>
                <BrainbaseLogo className={styles.headerBrainbaseLogo} color="white" cutoutColor="var(--bb-primary-color)" />
              </div>
            )}
            <span className={styles.headerAgentName}>{agentName}</span>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {/* Hero Image Section */}
        {homeImage && (
          <div className={styles.heroSection}>
            <img src={homeImage} alt="" className={styles.heroImage} />
          </div>
        )}

        {/* Title and Description */}
        {(homeTitle || homeDescription) && (
          <div className={styles.infoSection}>
            {homeTitle && <h2 className={styles.title}>{homeTitle}</h2>}
            {homeDescription && <p className={styles.description}>{homeDescription}</p>}
          </div>
        )}

        {/* Ask a Question Card */}
        <button className={styles.askCard} onClick={onStartChat} type="button">
          <div className={styles.askContent}>
            <span className={styles.askTitle}>Ask a question</span>
            <span className={styles.askSubtitle}>{agentName} and team can help</span>
          </div>
          <div className={styles.askIcon}>
            {agentLogoUrl ? (
              <img src={agentLogoUrl} alt="" className={styles.agentLogo} />
            ) : (
              <BrainbaseLogo className={styles.brainbaseLogo} color="currentColor" />
            )}
            <svg viewBox="0 0 24 24" fill="none" className={styles.chevron}>
              <path
                d="M9 18L15 12L9 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </button>
      </div>

      {/* Footer Navigation */}
      <nav className={styles.footer}>
        <button
          className={`${styles.navItem} ${currentPage === 'home' ? styles.active : ''}`}
          onClick={() => onNavigate('home')}
          type="button"
        >
          <svg viewBox="0 0 24 24" fill="none" className={styles.navIcon}>
            <path
              d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Home</span>
        </button>
        <button
          className={`${styles.navItem} ${currentPage === 'messages' ? styles.active : ''}`}
          onClick={() => onNavigate('messages')}
          type="button"
        >
          <svg viewBox="0 0 24 24" fill="none" className={styles.navIcon}>
            <path
              d="M8 12H8.01M12 12H12.01M16 12H16.01M21 12C21 16.4183 16.9706 20 12 20C10.4607 20 9.01172 19.6565 7.74467 19.0511L3 20L4.39499 16.28C3.51156 15.0423 3 13.5743 3 12C3 7.58172 7.02944 4 12 4C16.9706 4 21 7.58172 21 12Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Messages</span>
        </button>
      </nav>
    </div>
  );
};
