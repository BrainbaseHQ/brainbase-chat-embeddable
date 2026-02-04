import React, { useEffect, useRef } from 'react';
import type { Message as MessageType, ToolCall } from '../../types';
import { Message } from '../Message';
import { ToolCallDisplay } from '../ToolCallDisplay';
import { TypingIndicator } from '../TypingIndicator';
import styles from './MessageList.module.css';

export interface MessageListProps {
  messages: MessageType[];
  toolCalls?: ToolCall[];
  isLoading: boolean;
  showTypingIndicator?: boolean;
  agentName?: string;
  agentRole?: string;
  agentLogoUrl?: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  toolCalls = [],
  isLoading,
  showTypingIndicator = false,
  agentName,
  agentRole,
  agentLogoUrl,
}) => {
  // Find the last assistant message index
  const lastAssistantMessageIndex = messages.reduce((lastIndex, msg, index) => {
    return msg.role === 'assistant' ? index : lastIndex;
  }, -1);
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(messages.length);
  const prevToolCallCountRef = useRef(toolCalls.length);

  // Auto-scroll to bottom when:
  // - New messages are added (user sends or agent responds)
  // - Typing indicator appears
  // - Tool calls are added
  useEffect(() => {
    const hasNewMessages = messages.length > prevMessageCountRef.current;
    const hasNewToolCalls = toolCalls.length > prevToolCallCountRef.current;
    
    if (hasNewMessages || hasNewToolCalls || showTypingIndicator) {
      const list = listRef.current;
      if (list) {
        list.scrollTo({
          top: list.scrollHeight,
          behavior: 'smooth',
        });
      }
    }
    
    prevMessageCountRef.current = messages.length;
    prevToolCallCountRef.current = toolCalls.length;
  }, [messages.length, toolCalls.length, showTypingIndicator]);

  // Filter tool calls that are currently executing
  const activeToolCalls = toolCalls.filter(
    (tc) => tc.status === 'pending' || tc.status === 'executing'
  );

  return (
    <div className={styles.messageList} ref={listRef} role="log" aria-live="polite">
      {messages.length === 0 && !isLoading && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M8 12H8.01M12 12H12.01M16 12H16.01M21 12C21 16.4183 16.9706 20 12 20C10.4607 20 9.01172 19.6565 7.74467 19.0511L3 20L4.39499 16.28C3.51156 15.0423 3 13.5743 3 12C3 7.58172 7.02944 4 12 4C16.9706 4 21 7.58172 21 12Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className={styles.emptyText}>Start a conversation</p>
        </div>
      )}

      {messages.map((message, index) => (
        <Message
          key={message.id}
          message={message}
          agentName={agentName}
          agentRole={agentRole}
          isLastAssistantMessage={index === lastAssistantMessageIndex}
        />
      ))}

      {activeToolCalls.map((toolCall) => (
        <ToolCallDisplay key={toolCall.id} toolCall={toolCall} />
      ))}

      {showTypingIndicator && (
        <TypingIndicator agentName={agentName} agentLogoUrl={agentLogoUrl} />
      )}

      <div ref={bottomRef} />
    </div>
  );
};

