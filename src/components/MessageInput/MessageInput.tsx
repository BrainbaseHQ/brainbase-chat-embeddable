import React, { useState, useRef, useCallback, useEffect } from 'react';
import styles from './MessageInput.module.css';

export interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  onAttachment?: () => void;
  onEmoji?: () => void;
  onGif?: () => void;
  onVoice?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Message...',
  onAttachment,
  onEmoji,
  onGif,
  onVoice,
}) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmedValue = value.trim();
      if (trimmedValue && !disabled) {
        onSend(trimmedValue);
        setValue('');
        // Reset height after sending
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    },
    [value, disabled, onSend]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <form className={styles.inputWrapper} onSubmit={handleSubmit}>
      <div className={styles.inputContainer}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          aria-label="Message input"
        />
        <div className={styles.inputActions}>
          <div className={styles.actionIcons}>
            {onAttachment && (
              <button
                type="button"
                className={styles.iconButton}
                onClick={onAttachment}
                disabled={disabled}
                aria-label="Attach file"
              >
                {/* Paperclip icon */}
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59723 21.9983 8.005 21.9983C6.41277 21.9983 4.88584 21.3658 3.76 20.24C2.63416 19.1142 2.00166 17.5872 2.00166 15.995C2.00166 14.4028 2.63416 12.8758 3.76 11.75L12.33 3.18C13.0806 2.42975 14.0991 2.00127 15.16 2.00127C16.2209 2.00127 17.2394 2.42975 17.99 3.18C18.7403 3.93063 19.1687 4.94905 19.1687 6.01C19.1687 7.07095 18.7403 8.08937 17.99 8.84L9.41 17.41C9.03472 17.7853 8.52573 17.9961 7.995 17.9961C7.46427 17.9961 6.95528 17.7853 6.58 17.41C6.20472 17.0347 5.99389 16.5257 5.99389 15.995C5.99389 15.4643 6.20472 14.9553 6.58 14.58L15.07 6.1"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            {onEmoji && (
              <button
                type="button"
                className={styles.iconButton}
                onClick={onEmoji}
                disabled={disabled}
                aria-label="Add emoji"
              >
                {/* Emoji icon */}
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="9" cy="9" r="1" fill="currentColor" />
                  <circle cx="15" cy="9" r="1" fill="currentColor" />
                </svg>
              </button>
            )}
            {onGif && (
              <button
                type="button"
                className={styles.iconButton}
                onClick={onGif}
                disabled={disabled}
                aria-label="Add GIF"
              >
                {/* GIF icon */}
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 10V14M8 12H10M8 10H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M13 10V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M16 10V14M16 10H18M16 12H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            {onVoice && (
              <button
                type="button"
                className={styles.iconButton}
                onClick={onVoice}
                disabled={disabled}
                aria-label="Voice message"
              >
                {/* Microphone icon */}
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="2" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="2" />
                  <path d="M5 10V11C5 14.866 8.13401 18 12 18C15.866 18 19 14.866 19 11V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 18V22M12 22H8M12 22H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
          <button
            type={value.trim() ? 'submit' : 'button'}
            className={`${styles.sendButton} ${!value.trim() ? styles.audioButton : ''}`}
            disabled={disabled}
            aria-label={value.trim() ? 'Send message' : 'Voice message'}
            onClick={!value.trim() ? onVoice : undefined}
          >
            {value.trim() ? (
              /* Arrow up icon */
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 19V5M12 5L5 12M12 5L19 12"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              /* Audio waveform icon */
              <svg viewBox="0 0 24 24" fill="none" className={styles.audioIcon}>
                <path d="M4 10V14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M9 6V18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M14 8V16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M19 10V14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

