import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  Message,
  ToolCall,
  Session,
  DeploymentConfig,
  SSEEvent,
  BrainbaseAPIClient,
} from '../types';
import { generateSessionId } from '../utils/generateSessionId';
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
    const newSessionId = generateSessionId();
    sessionStartTime.current = Date.now();

    try {
      if (mockMode) {
        await (apiClient as MockAPIClient).startSession();
      } else {
        await (apiClient as BrainbaseAPIClient).startSession({
          sessionId: newSessionId,
          deploymentId: config.deploymentId,
          workerId: config.workerId,
          flowId: config.flowId,
          userAgent: navigator.userAgent,
          originUrl: window.location.href,
        });
      }

      setSessionId(newSessionId);
      onSessionStart?.(newSessionId);

      // Add welcome message if configured
      if (config.welcomeMessage) {
        const welcomeMsg: Message = {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: config.welcomeMessage,
          timestamp: Date.now(),
          status: 'sent',
        };
        setMessages([welcomeMsg]);
        onMessage?.(welcomeMsg);
      }

      return newSessionId;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to start session');
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [config, apiClient, mockMode, onSessionStart, onMessage, onError]);

  const handleSSEEvent = useCallback(
    (event: SSEEvent, messageId: string) => {
      switch (event.type) {
        case 'say':
        case 'talk': {
          const data = event.data as { text: string; partial?: boolean };
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    content: data.text,
                    status: data.partial ? 'streaming' : 'sent',
                  }
                : m
            )
          );
          break;
        }
        case 'function_call': {
          const data = event.data as {
            name: string;
            arguments?: Record<string, unknown>;
            result?: unknown;
            status?: string;
          };

          setToolCalls((prev) => {
            // Check if this is an update to an existing tool call
            const existingIndex = prev.findIndex(
              (tc) => tc.name === data.name && tc.status === 'pending'
            );

            if (existingIndex !== -1 && data.result !== undefined) {
              // Update existing tool call with result
              return prev.map((tc, i) =>
                i === existingIndex
                  ? { ...tc, result: data.result, status: 'completed' as const }
                  : tc
              );
            }

            if (existingIndex === -1 && data.arguments) {
              // Add new tool call
              return [
                ...prev,
                {
                  id: `tc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  name: data.name,
                  arguments: data.arguments,
                  status: 'pending' as const,
                  timestamp: Date.now(),
                },
              ];
            }

            return prev;
          });
          break;
        }
        case 'completed': {
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, status: 'sent' } : m))
          );
          break;
        }
        case 'error': {
          const data = event.data as { message?: string };
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    status: 'error',
                    content: data.message ?? 'An error occurred',
                  }
                : m
            )
          );
          break;
        }
      }
    },
    []
  );

  const processSSEStream = useCallback(
    async (stream: ReadableStream<Uint8Array>, messageId: string) => {
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6)) as SSEEvent;
                handleSSEEvent(event, messageId);
              } catch {
                // Ignore parse errors for malformed JSON
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

      let currentSessionId = sessionId;
      if (!currentSessionId) {
        currentSessionId = await startNewSession();
      }

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

      try {
        if (mockMode) {
          // Handle AsyncGenerator (mock mode)
          const generator = (apiClient as MockAPIClient).sendMessage(content);
          for await (const event of generator) {
            handleSSEEvent(event, assistantMessageId);
          }
        } else {
          // Handle ReadableStream (real API)
          const stream = await (apiClient as BrainbaseAPIClient).sendMessage({
            sessionId: currentSessionId,
            deploymentId: config.deploymentId,
            workerId: config.workerId,
            flowId: config.flowId,
            message: content,
          });
          await processSSEStream(stream, assistantMessageId);
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
      startNewSession,
      apiClient,
      mockMode,
      config,
      handleSSEEvent,
      processSSEStream,
      onMessage,
      onError,
    ]
  );

  const endCurrentSession = useCallback(async (): Promise<void> => {
    if (!sessionId) return;

    try {
      if (mockMode) {
        await (apiClient as MockAPIClient).endSession();
      } else {
        await (apiClient as BrainbaseAPIClient).endSession({
          workerId: config.workerId,
          sessionId,
          messages,
          toolCalls,
          messageCount: messages.length,
          startTime: sessionStartTime.current,
          endTime: Date.now(),
        });
      }

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
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to end session');
      setError(error);
      onError?.(error);
    }
  }, [
    sessionId,
    config,
    messages,
    toolCalls,
    apiClient,
    mockMode,
    onSessionEnd,
    onError,
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

