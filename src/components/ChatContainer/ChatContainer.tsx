import React, { useState } from 'react';
import type { DeploymentConfig, Message, ToolCall } from '../../types';
import { ChatHeader } from '../ChatHeader';
import { MessageList } from '../MessageList';
import { MessageInput } from '../MessageInput';
import { PoweredBy } from '../PoweredBy';
import { VoiceMode } from '../VoiceMode';
import styles from './ChatContainer.module.css';

export interface ChatContainerProps {
  config: DeploymentConfig;
  messages: Message[];
  toolCalls?: ToolCall[];
  isLoading: boolean;
  showTypingIndicator?: boolean;
  isExpanded?: boolean;
  headerSubtitle?: string;
  voiceTokenUrl?: string;
  voiceAgentName?: string;
  enableVoiceMode?: boolean;
  onSendMessage: (message: string) => void;
  onClose?: () => void;
  onBack?: () => void;
  onNewChat?: () => void;
  onExpandWindow?: () => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  config,
  messages,
  toolCalls = [],
  isLoading,
  showTypingIndicator = false,
  isExpanded = false,
  headerSubtitle,
  voiceTokenUrl,
  voiceAgentName = 'voice-agent',
  enableVoiceMode = false,
  onSendMessage,
  onClose,
  onBack,
  onNewChat,
  onExpandWindow,
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const hasMessages = messages.length > 0;

  // Voice mode is available if both enableVoiceMode is true AND voiceTokenUrl is provided
  const isVoiceAvailable = enableVoiceMode && !!voiceTokenUrl;

  const handleVoiceClick = () => {
    if (isVoiceAvailable) {
      setIsVoiceMode(true);
    }
  };

  const handleVoiceClose = () => {
    setIsVoiceMode(false);
  };

  // Download transcript as a text file
  const handleDownloadTranscript = () => {
    if (messages.length === 0) return;

    const transcript = messages
      .map((msg) => {
        const role = msg.role === 'user' ? 'You' : (config.agentName || 'Assistant');
        const timestamp = new Date(msg.timestamp).toLocaleString();
        return `[${timestamp}] ${role}:\n${msg.content}\n`;
      })
      .join('\n');

    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-transcript-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleNewChatRequest = () => {
    setShowConfirmation(true);
  };

  const handleConfirmNewChat = () => {
    setShowConfirmation(false);
    onNewChat?.();
  };

  const handleCancelNewChat = () => {
    setShowConfirmation(false);
  };

  return (
    <div className={styles.container} role="dialog" aria-label="Chat window">
      <ChatHeader
        agentName={config.agentName}
        agentLogoUrl={config.agentLogoUrl}
        headerSubtitle={headerSubtitle}
        welcomeTitle={config.welcomeMessage || "Hello there."}
        welcomeSubtitle={config.welcomeMessage ? undefined : "How can we help?"}
        onClose={onClose}
        onBack={onBack}
        onNewChatRequest={handleNewChatRequest}
        onExpandWindow={onExpandWindow}
        onDownloadTranscript={hasMessages ? handleDownloadTranscript : undefined}
        showMenuButton={hasMessages}
        isExpanded={isExpanded}
        compact={hasMessages}
      />
      <div className={styles.body}>
        {isVoiceMode && isVoiceAvailable ? (
          <VoiceMode
            tokenUrl={voiceTokenUrl!}
            agentName={voiceAgentName}
            onClose={handleVoiceClose}
            accentColor={config.primaryColor}
          />
        ) : (
          <>
            <MessageList
              messages={messages}
              toolCalls={toolCalls}
              isLoading={isLoading}
              showTypingIndicator={showTypingIndicator}
              agentName={config.agentName}
              agentRole={config.agentRole}
              agentLogoUrl={config.agentLogoUrl}
            />
            <MessageInput
              onSend={onSendMessage}
              disabled={isLoading}
              placeholder="Message..."
              onAttachment={() => {/* TODO: implement attachment */}}
              onEmoji={() => {/* TODO: implement emoji picker */}}
              onGif={() => {/* TODO: implement GIF picker */}}
              onVoice={isVoiceAvailable ? handleVoiceClick : undefined}
            />
          </>
        )}
      </div>
      <PoweredBy showBranding={(config.styling?.showBranding as boolean) ?? true} />

      {/* Confirmation dialog - positioned at container level to overlay entire widget */}
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
