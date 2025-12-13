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
  onSessionStart?: (sessionId: string) => void;
  onSessionEnd?: (session: Session) => void;
  onMessage?: (message: Message) => void;
  onError?: (error: Error) => void;
}

export interface UseChatReturn {
  messages: Message[];
  toolCalls: ToolCall[];
  isLoading: boolean;
  error: Error | null;
  sessionId: string | null;
  sendMessage: (content: string) => Promise<void>;
  endSession: () => Promise<void>;
  clearMessages: () => void;
  startNewSession: () => Promise<string>;
}

export function useChat(options: UseChatOptions): UseChatReturn {
  const {
    config,
    apiClient,
    mockMode,
    onSessionStart,
    onSessionEnd,
    onMessage,
    onError,
  } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const sessionStartTime = useRef<number>(0);
  const isInitialized = useRef(false);

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
          // Agent message
          const data = event.data as { content: string; role?: string };
          if (data.content) {
            setMessages((prev) => {
              const currentMsg = prev.find((m) => m.id === messageId);
              // If the placeholder already has content, create a new message
              if (currentMsg && currentMsg.content) {
                const newMessageId = `assistant-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                return [
                  ...prev.map((m) =>
                    m.id === messageId ? { ...m, status: 'sent' as const } : m
                  ),
                  {
                    id: newMessageId,
                    role: 'assistant' as const,
                    content: data.content,
                    timestamp: Date.now(),
                    status: 'streaming' as const,
                  },
                ];
              }
              // Otherwise, update the existing placeholder
              return prev.map((m) =>
                m.id === messageId
                  ? { ...m, content: data.content, status: 'streaming' as const }
                  : m
              );
            });
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
            setMessages((prev) =>
              prev.map((m) =>
                m.id === messageId
                  ? { ...m, content: data.content as string, status: 'streaming' as const }
                  : m
              )
            );
          }
          break;
        }
        case 'waiting': {
          // Agent is processing - no action needed
          break;
        }
        case 'done': {
          // Stream complete
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, status: 'sent' as const } : m))
          );
          break;
        }
        case 'completed': {
          // Conversation ended by agent
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, status: 'sent' as const } : m))
          );
          // Mark session as completed
          if (sessionId) {
            storeSession(config.embedId, {
              sessionId,
              deploymentId: config.deploymentId,
              workerId: config.workerId,
              flowId: config.flowId,
              startTime: sessionStartTime.current,
              messages,
              toolCalls,
              status: 'completed',
            });
          }
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
    [config, sessionId, messages, toolCalls, onSessionStart]
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
          while (buffer.includes('\n\n')) {
            const [message, rest] = buffer.split('\n\n', 2);
            buffer = rest;

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

      // Create placeholder for assistant response
      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        status: 'streaming',
      };
      setMessages((prev) => [...prev, assistantMessage]);

      setIsLoading(true);
      setError(null);

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

        // Mark as sent if still streaming
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId && m.status === 'streaming'
              ? { ...m, status: 'sent' }
              : m
          )
        );
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to send message');
        setError(error);
        onError?.(error);

        // Mark message as error
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, status: 'error', content: 'Failed to get response' }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      sessionId,
      apiClient,
      mockMode,
      config.embedId,
      handleSSEEvent,
      processSSEStream,
      onMessage,
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
    error,
    sessionId,
    sendMessage,
    endSession: endCurrentSession,
    clearMessages,
    startNewSession,
  };
}

