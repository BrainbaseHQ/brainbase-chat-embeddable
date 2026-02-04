import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  Message,
  ToolCall,
  Session,
  DeploymentConfig,
  SSEEvent,
  BrainbaseAPIClient,
} from '../types';
import {
  getStoredSession,
  storeSession,
  clearSession,
} from '../utils/sessionStorage';
import type { MockAPIClient } from '../api/mock';

interface UseChatOptions {
  config: DeploymentConfig;
  apiClient: BrainbaseAPIClient | MockAPIClient;
  mockMode?: boolean;
  streamMessages?: boolean;
  artificialDelay?: [number, number];
  onSessionStart?: (sessionId: string) => void;
  onSessionEnd?: (session: Session) => void;
  onMessage?: (message: Message) => void;
  onError?: (error: Error) => void;
}

export interface UseChatReturn {
  messages: Message[];
  toolCalls: ToolCall[];
  isLoading: boolean;
  showTypingIndicator: boolean;
  error: Error | null;
  sessionId: string | null;
  sendMessage: (content: string) => Promise<void>;
  sendTriggerMessage: () => Promise<void>;
  endSession: () => Promise<void>;
  clearMessages: () => void;
  startNewSession: () => Promise<string>;
}

export function useChat(options: UseChatOptions): UseChatReturn {
  const {
    config,
    apiClient,
    mockMode,
    streamMessages = false,
    artificialDelay,
    onSessionStart,
    onSessionEnd,
    onMessage,
    onError,
  } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const sessionStartTime = useRef<number>(0);
  const isInitialized = useRef(false);
  const streamBuffers = useRef<Record<string, string>>({});
  const typingIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const responseDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper to get random delay from artificial delay range (in ms)
  const getRandomDelay = useCallback(() => {
    if (!artificialDelay) return 0;
    const [min, max] = artificialDelay;
    return (min + Math.random() * (max - min)) * 1000; // Convert seconds to ms
  }, [artificialDelay]);

  // Initialize or restore session
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const stored = getStoredSession(config.embedId);
    if (stored && stored.status === 'active') {
      setSessionId(stored.sessionId);
      setMessages(stored.messages);
      setToolCalls(stored.toolCalls);
      sessionStartTime.current = stored.startTime;
    }
    // Note: Welcome message is handled by the engine, not the widget
  }, [config.embedId]);

  // Persist session on changes
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      storeSession(config.embedId, {
        sessionId,
        deploymentId: config.deploymentId,
        workerId: config.workerId,
        flowId: config.flowId,
        startTime: sessionStartTime.current,
        messages,
        toolCalls,
        status: 'active',
      });
    }
  }, [sessionId, messages, toolCalls, config]);

  const startNewSession = useCallback(async (): Promise<string> => {
    // Session is created server-side, we just reset local state
    // Welcome message is also handled by the engine
    sessionStartTime.current = Date.now();
    setSessionId(null);
    setMessages([]);
    setToolCalls([]);
    clearSession(config.embedId);

    return '';
  }, [config.embedId]);

  const addMessageToState = useCallback((messageId: string, content: string, status: 'streaming' | 'sent') => {
    setMessages((prev) => {
      let found = false;
      const next = prev.map((m) => {
        if (m.id === messageId) {
          found = true;
          return { ...m, content, status };
        }
        return m;
      });

      if (!found) {
        next.push({
          id: messageId,
          role: 'assistant',
          content,
          timestamp: Date.now(),
          status,
        });
      }

      return next;
    });
  }, []);

  const upsertAssistantMessage = useCallback((messageId: string, content: string, forceAdd = false) => {
    // In non-streaming mode, we don't update the UI until the message is complete
    if (!streamMessages && !forceAdd) {
      // Just buffer the content, don't update messages yet
      return;
    }
    
    if (forceAdd && artificialDelay) {
      // Apply artificial delay before showing the complete message
      const responseDelay = getRandomDelay();
      if (responseDelayTimeoutRef.current) {
        clearTimeout(responseDelayTimeoutRef.current);
      }
      responseDelayTimeoutRef.current = setTimeout(() => {
        addMessageToState(messageId, content, 'sent');
      }, responseDelay);
    } else {
      addMessageToState(messageId, content, forceAdd ? 'sent' : 'streaming');
    }
  }, [streamMessages, artificialDelay, getRandomDelay, addMessageToState]);

  const handleSSEEvent = useCallback(
    (event: SSEEvent, messageId: string, updateSessionId: (id: string) => void) => {
      switch (event.type) {
        case 'session': {
          // Session info from server
          const data = event.data as { session_id: string; is_new: boolean };
          if (data.session_id) {
            updateSessionId(data.session_id);
            if (data.is_new) {
              sessionStartTime.current = Date.now();
              onSessionStart?.(data.session_id);
            }
          }
          break;
        }
        case 'message': {
          // Agent message (complete message, e.g., from say())
          const data = event.data as { content: string; role?: string };
          if (data.content) {
            streamBuffers.current[messageId] = data.content;
            upsertAssistantMessage(messageId, data.content);
          }
          break;
        }
        case 'chunk': {
          // Streaming chunk - append to existing message content
          const data = event.data as { content: string };
          if (data.content) {
            const current = streamBuffers.current[messageId] ?? '';
            const next = current + data.content;
            streamBuffers.current[messageId] = next;
            upsertAssistantMessage(messageId, next);
          }
          break;
        }
        case 'tool_call': {
          // Tool/function call
          const data = event.data as {
            function: string;
            content?: string;
            args?: Record<string, unknown>;
            result?: unknown;
          };

          setToolCalls((prev) => {
            // Check if this is an update to an existing tool call
            const existingIndex = prev.findIndex(
              (tc) => tc.name === data.function && tc.status === 'pending'
            );

            if (existingIndex !== -1 && data.result !== undefined) {
              // Update existing tool call with result
              return prev.map((tc, i) =>
                i === existingIndex
                  ? { ...tc, result: data.result, status: 'completed' as const }
                  : tc
              );
            }

            if (existingIndex === -1) {
              // Add new tool call
              return [
                ...prev,
                {
                  id: `tc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  name: data.function,
                  arguments: data.args ?? {},
                  status: 'pending' as const,
                  timestamp: Date.now(),
                },
              ];
            }

            return prev;
          });

          // If tool call has content, also update the message
          if (data.content) {
            const content = data.content as string;
            streamBuffers.current[messageId] = content;
            upsertAssistantMessage(messageId, content);
          }
          break;
        }
        case 'waiting': {
          // Agent is processing - no action needed
          break;
        }
        case 'done': {
          // Stream complete
          if (!streamMessages) {
            // In non-streaming mode, add the complete message now
            const finalContent = streamBuffers.current[messageId] ?? '';
            if (finalContent) {
              upsertAssistantMessage(messageId, finalContent, true);
            }
          } else {
            // In streaming mode, just mark as sent
            setMessages((prev) =>
              prev.map((m) => (m.id === messageId ? { ...m, status: 'sent' as const } : m))
            );
          }
          delete streamBuffers.current[messageId];
          break;
        }
        case 'completed': {
          // Conversation ended by agent
          if (!streamMessages) {
            // In non-streaming mode, add the complete message now
            const finalContent = streamBuffers.current[messageId] ?? '';
            if (finalContent) {
              upsertAssistantMessage(messageId, finalContent, true);
            }
          }
          
          setMessages((prev) => {
            const updatedMessages = prev.map((m) =>
              m.id === messageId ? { ...m, status: 'sent' as const } : m
            );
            // Mark session as completed with current messages
            if (sessionId) {
              storeSession(config.embedId, {
                sessionId,
                deploymentId: config.deploymentId,
                workerId: config.workerId,
                flowId: config.flowId,
                startTime: sessionStartTime.current,
                messages: updatedMessages,
                toolCalls: [], // Tool calls stored separately
                status: 'completed',
              });
            }
            return updatedMessages;
          });
          delete streamBuffers.current[messageId];
          break;
        }
        case 'error': {
          const data = event.data as { error?: string };
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    status: 'error' as const,
                    content: data.error ?? 'An error occurred',
                  }
                : m
            )
          );
          break;
        }
      }
    },
    [config, sessionId, streamMessages, onSessionStart, upsertAssistantMessage]
  );

  const processSSEStream = useCallback(
    async (stream: ReadableStream<Uint8Array>, messageId: string, updateSessionId: (id: string) => void) => {
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          // SSE messages are separated by double newlines
          // Note: We use indexOf instead of split with limit because split(str, 2)
          // only returns 2 elements and discards the rest, causing dropped chunks
          let idx: number;
          while ((idx = buffer.indexOf('\n\n')) !== -1) {
            const message = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);

            // Parse SSE data lines
            for (const line of message.split('\n')) {
              if (line.startsWith('data: ')) {
                try {
                  const event = JSON.parse(line.slice(6)) as SSEEvent;
                  handleSSEEvent(event, messageId, updateSessionId);
                } catch {
                  // Ignore parse errors for malformed JSON
                }
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    },
    [handleSSEEvent]
  );

  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      if (!content.trim()) return;

      // Add user message
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: Date.now(),
        status: 'sent',
      };
      setMessages((prev) => [...prev, userMessage]);
      onMessage?.(userMessage);

      // Create placeholder for assistant response (only in streaming mode)
      const assistantMessageId = `assistant-${Date.now()}`;
      if (streamMessages) {
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          status: 'streaming',
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }

      setIsLoading(true);
      setError(null);
      
      // Clear any existing typing indicator timeout
      if (typingIndicatorTimeoutRef.current) {
        clearTimeout(typingIndicatorTimeoutRef.current);
      }
      
      // Start typing indicator after 1 second delay (+ artificial delay if set)
      const typingDelay = 1000 + getRandomDelay();
      typingIndicatorTimeoutRef.current = setTimeout(() => {
        setShowTypingIndicator(true);
      }, typingDelay);

      // Create a callback to update session ID when received from server
      const updateSessionId = (newSessionId: string) => {
        setSessionId(newSessionId);
      };

      try {
        if (mockMode) {
          // Handle AsyncGenerator (mock mode)
          const generator = (apiClient as MockAPIClient).sendMessage(content);
          for await (const event of generator) {
            handleSSEEvent(event, assistantMessageId, updateSessionId);
          }
        } else {
          // Handle ReadableStream (real API)
          const stream = await (apiClient as BrainbaseAPIClient).sendMessage({
            embedId: config.embedId,
            message: content,
            sessionId: sessionId ?? undefined,
          });
          await processSSEStream(stream, assistantMessageId, updateSessionId);
        }

        // Mark as sent if still streaming (only in streaming mode)
        if (streamMessages) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId && m.status === 'streaming'
                ? { ...m, status: 'sent' }
                : m
            )
          );
        }
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to send message');
        setError(error);
        onError?.(error);

        // Mark message as error (only if message exists in streaming mode)
        if (streamMessages) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, status: 'error', content: 'Failed to get response' }
                : m
            )
          );
        }
      } finally {
        // Clear typing indicator timeout if still pending
        if (typingIndicatorTimeoutRef.current) {
          clearTimeout(typingIndicatorTimeoutRef.current);
          typingIndicatorTimeoutRef.current = null;
        }
        setShowTypingIndicator(false);
        setIsLoading(false);
      }
    },
    [
      sessionId,
      apiClient,
      mockMode,
      streamMessages,
      getRandomDelay,
      config.embedId,
      handleSSEEvent,
      processSSEStream,
      onMessage,
      onError,
    ]
  );

  // Send a trigger message to start the conversation without showing a user message
  const sendTriggerMessage = useCallback(
    async (): Promise<void> => {
      // Create placeholder for assistant response (only in streaming mode)
      const assistantMessageId = `assistant-${Date.now()}`;
      if (streamMessages) {
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          status: 'streaming',
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }

      setIsLoading(true);
      setError(null);
      
      // Clear any existing typing indicator timeout
      if (typingIndicatorTimeoutRef.current) {
        clearTimeout(typingIndicatorTimeoutRef.current);
      }
      
      // Start typing indicator after 1 second delay (+ artificial delay if set)
      const typingDelay = 1000 + getRandomDelay();
      typingIndicatorTimeoutRef.current = setTimeout(() => {
        setShowTypingIndicator(true);
      }, typingDelay);

      // Create a callback to update session ID when received from server
      const updateSessionId = (newSessionId: string) => {
        setSessionId(newSessionId);
      };

      try {
        // Send an empty/trigger message - the backend should handle this as a conversation starter
        const triggerContent = '';
        
        if (mockMode) {
          // Handle AsyncGenerator (mock mode)
          const generator = (apiClient as MockAPIClient).sendMessage(triggerContent);
          for await (const event of generator) {
            handleSSEEvent(event, assistantMessageId, updateSessionId);
          }
        } else {
          // Handle ReadableStream (real API)
          const stream = await (apiClient as BrainbaseAPIClient).sendMessage({
            embedId: config.embedId,
            message: triggerContent,
            sessionId: sessionId ?? undefined,
          });
          await processSSEStream(stream, assistantMessageId, updateSessionId);
        }

        // Mark as sent if still streaming (only in streaming mode)
        if (streamMessages) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId && m.status === 'streaming'
                ? { ...m, status: 'sent' }
                : m
            )
          );
        }
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to send message');
        setError(error);
        onError?.(error);

        // Mark message as error (only if message exists in streaming mode)
        if (streamMessages) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, status: 'error', content: 'Failed to get response' }
                : m
            )
          );
        }
      } finally {
        // Clear typing indicator timeout if still pending
        if (typingIndicatorTimeoutRef.current) {
          clearTimeout(typingIndicatorTimeoutRef.current);
          typingIndicatorTimeoutRef.current = null;
        }
        setShowTypingIndicator(false);
        setIsLoading(false);
      }
    },
    [
      sessionId,
      apiClient,
      mockMode,
      streamMessages,
      getRandomDelay,
      config.embedId,
      handleSSEEvent,
      processSSEStream,
      onError,
    ]
  );

  const endCurrentSession = useCallback(async (): Promise<void> => {
    // Session ending is handled server-side when conversation completes
    // This just clears local state
    if (!sessionId) return;

    const session: Session = {
      sessionId,
      deploymentId: config.deploymentId,
      workerId: config.workerId,
      flowId: config.flowId,
      startTime: sessionStartTime.current,
      messages,
      toolCalls,
      status: 'completed',
    };

    onSessionEnd?.(session);
    clearSession(config.embedId);
    setSessionId(null);
    setMessages([]);
    setToolCalls([]);
    // Note: Welcome message is handled by the engine when a new session starts
  }, [
    sessionId,
    config,
    messages,
    toolCalls,
    onSessionEnd,
  ]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setToolCalls([]);
  }, []);

  return {
    messages,
    toolCalls,
    isLoading,
    showTypingIndicator,
    error,
    sessionId,
    sendMessage,
    sendTriggerMessage,
    endSession: endCurrentSession,
    clearMessages,
    startNewSession,
  };
}

