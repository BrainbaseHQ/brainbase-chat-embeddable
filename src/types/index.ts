// Deployment configuration from API
export interface DeploymentConfig {
  embedId: string;
  deploymentId: string;
  workerId: string;
  flowId: string;
  welcomeMessage?: string;
  agentName?: string;
  agentLogoUrl?: string;
  primaryColor?: string;
  styling?: Record<string, unknown>;
}

// Message types
export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'streaming' | 'error';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  status?: MessageStatus;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'executing' | 'completed' | 'error';
  timestamp: number;
}

// SSE Event types (from engine)
export type SSEEventType =
  | 'say' // Agent text response
  | 'talk' // Agent speaking (for voice, maps to text here)
  | 'function_call' // Tool/function execution
  | 'waiting_for_response' // Agent waiting
  | 'completed' // Session complete
  | 'error'; // Error occurred

export interface SSEEvent {
  type: SSEEventType;
  data: unknown;
  timestamp?: number;
}

// Session state
export interface Session {
  sessionId: string;
  deploymentId: string;
  workerId: string;
  flowId: string;
  startTime: number;
  messages: Message[];
  toolCalls: ToolCall[];
  status: 'active' | 'completed' | 'error';
}

// Widget props
export interface ChatWidgetProps {
  /** The embed ID from your Brainbase deployment */
  embedId: string;

  /** API base URL (defaults to production) */
  apiBaseUrl?: string;

  /** Enable mock mode for UI development */
  mockMode?: boolean;

  /** Custom mock responses for mock mode */
  mockResponses?: MockResponse[];

  /** Position of the widget */
  position?: 'bottom-right' | 'bottom-left' | 'inline';

  /** Whether widget starts open */
  defaultOpen?: boolean;

  /** Override primary color */
  primaryColor?: string;

  /** Override agent name */
  agentName?: string;

  /** Override welcome message */
  welcomeMessage?: string;

  /** Custom CSS class */
  className?: string;

  /** Callback when session starts */
  onSessionStart?: (sessionId: string) => void;

  /** Callback when session ends */
  onSessionEnd?: (session: Session) => void;

  /** Callback on message received */
  onMessage?: (message: Message) => void;

  /** Callback on error */
  onError?: (error: Error) => void;
}

// Mock mode types
export interface MockResponse {
  trigger: string | RegExp;
  response: string;
  delay?: number;
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, unknown>;
    result: unknown;
  }>;
}

// API Client interface
export interface BrainbaseAPIClient {
  getDeploymentConfig(embedId: string): Promise<DeploymentConfig>;
  startSession(params: StartSessionParams): Promise<void>;
  sendMessage(params: SendMessageParams): Promise<ReadableStream<Uint8Array>>;
  endSession(params: EndSessionParams): Promise<void>;
}

export interface StartSessionParams {
  deploymentId: string;
  workerId: string;
  flowId: string;
  sessionId: string;
  userAgent: string;
  originUrl: string;
}

export interface SendMessageParams {
  sessionId: string;
  deploymentId: string;
  workerId: string;
  flowId: string;
  message: string;
}

export interface EndSessionParams {
  workerId: string;
  sessionId: string;
  messages: Message[];
  toolCalls: ToolCall[];
  messageCount: number;
  startTime: number;
  endTime: number;
}

