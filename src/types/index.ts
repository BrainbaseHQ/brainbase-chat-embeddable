// Deployment configuration from API
export interface DeploymentConfig {
  embedId: string;
  deploymentId: string;
  workerId: string;
  flowId: string;
  welcomeMessage?: string;
  agentName?: string;
  agentRole?: string;
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
  | 'chunk' // Streaming chunk (token-by-token content)
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

// Theme options
export type ChatWidgetTheme = 'light' | 'dark' | 'granite';

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

  /** Accent color for buttons and icons - NOT header (defaults to primaryColor) */
  accentColor?: string;

  /** Use gradient on header (default: false) */
  primaryGradient?: boolean;

  /** Use gradient on accent elements like buttons and icons (default: false) */
  accentGradient?: boolean;

  /** Header text color (default: based on theme - black for light/dark, gray for granite) */
  headerTextColor?: string;

  /** Stream messages token by token (default: false - show full message when complete) */
  streamMessages?: boolean;

  /** Artificial delay range in seconds [min, max] for typing indicator and response. 
   * Adds random delay before showing dots and before showing response.
   * Default: undefined (no artificial delay, just 1s delay for typing indicator) */
  artificialDelay?: [number, number];

  /** Home page hero image URL (optional) */
  homeImage?: string;

  /** Home page title text (optional) */
  homeTitle?: string;

  /** Home page description text (optional) */
  homeDescription?: string;

  /** URL to open when home page info card is clicked (optional) */
  homeLink?: string;

  /** Time in seconds before the widget auto-opens and sends a trigger message.
   * When set, the widget will automatically open after this delay and send a hidden 
   * message to trigger the agent. Default: undefined (never auto-opens) */
  timeToOpen?: number;

  /** URL for the LiveKit token endpoint (e.g., 'https://your-app.com/api/token').
   * Required for voice mode to work. */
  voiceTokenUrl?: string;

  /** Agent name for voice mode dispatch. Default: 'voice-agent' */
  voiceAgentName?: string;

  /** Enable voice mode (audio button in input). Default: false */
  enableVoiceMode?: boolean;

  /** Show the collapse button (circle with down arrow) when widget is open. Default: true */
  showCollapseButton?: boolean;

  /** Override agent name */
  agentName?: string;

  /** Override agent role (e.g., "AI Agent", "Support Bot") */
  agentRole?: string;

  /** Description shown below agent name in header (e.g., "The team can also help") */
  headerSubtitle?: string;

  /** Override agent logo URL */
  agentLogoUrl?: string;

  /** Agent name font size in pixels (default: 16) */
  agentNameFontSize?: number;

  /** Custom icon for the toggle button (when closed). Can be a URL or React node */
  toggleIcon?: string | React.ReactNode;

  /** Override welcome message */
  welcomeMessage?: string;

  /** Override branding visibility */
  showBranding?: boolean;

  /** Widget width in pixels (default: 420) */
  width?: number;

  /** Widget height in pixels (default: 720) */
  height?: number;

  /** Expanded widget width in pixels (default: 640) */
  expandedWidth?: number;

  /** Expanded widget height in pixels (default: 800) */
  expandedHeight?: number;

  /** Message font size in pixels (default: 15) */
  messageFontSize?: number;

  /** Theme: 'light' (default), 'dark', or 'granite' */
  theme?: ChatWidgetTheme;

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

