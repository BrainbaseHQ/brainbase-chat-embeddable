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

// SSE Event types (from messaging server)
export type SSEEventType =
  | 'session' // Session info (session_id, is_new)
  | 'message' // Agent text response (content, role)
  | 'tool_call' // Tool/function execution
  | 'waiting' // Agent is processing
  | 'done' // Stream complete
  | 'completed' // Conversation ended
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

  /** Override branding visibility */
  showBranding?: boolean;

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
  sendMessage(params: SendMessageParams): Promise<ReadableStream<Uint8Array>>;
}

export interface SendMessageParams {
  embedId: string;
  message: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

