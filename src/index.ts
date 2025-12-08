// Import global styles
import './styles/variables.css';

// Components
export { ChatWidget } from './components/ChatWidget';
export { ChatContainer } from './components/ChatContainer';
export { ChatHeader } from './components/ChatHeader';
export { ChatToggleButton } from './components/ChatToggleButton';
export { Message } from './components/Message';
export { MessageList } from './components/MessageList';
export { MessageInput } from './components/MessageInput';
export { ToolCallDisplay } from './components/ToolCallDisplay';
export { TypingIndicator } from './components/TypingIndicator';

// Hooks (for advanced usage)
export { useChat } from './hooks/useChat';
export type { UseChatReturn } from './hooks/useChat';

// API Clients
export { createAPIClient } from './api/client';
export { createMockAPIClient } from './api/mock';
export type { MockAPIClient } from './api/mock';

// Types
export type {
  ChatWidgetProps,
  DeploymentConfig,
  Message as MessageType,
  ToolCall,
  Session,
  MockResponse,
  SSEEvent,
  SSEEventType,
  MessageRole,
  MessageStatus,
  BrainbaseAPIClient,
  StartSessionParams,
  SendMessageParams,
  EndSessionParams,
} from './types';

// Utilities
export { generateSessionId } from './utils/generateSessionId';
export {
  getStoredSession,
  storeSession,
  clearSession,
} from './utils/sessionStorage';

