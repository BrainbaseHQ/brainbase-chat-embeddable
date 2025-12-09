# @brainbase-labs/chat-widget

A React chat widget for embedding [Brainbase Labs](https://brainbaselabs.com) AI agents in your applications.

[![npm version](https://img.shields.io/npm/v/@brainbase-labs/chat-widget.svg)](https://www.npmjs.com/package/@brainbase-labs/chat-widget)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- 🚀 **Drop-in React component** - Add AI chat to your app in minutes
- 🎨 **Fully customizable** - Theme with CSS variables or override styles
- 📱 **Responsive** - Works on desktop and mobile
- 🔄 **Session persistence** - Conversations survive page refreshes
- 🛠️ **Tool call support** - Display function calls and results
- 🧪 **Mock mode** - Develop UI without a backend connection

## Installation

```bash
npm install @brainbase-labs/chat-widget
# or
yarn add @brainbase-labs/chat-widget
# or
pnpm add @brainbase-labs/chat-widget
```

## Quick Start

```tsx
import { ChatWidget } from '@brainbase-labs/chat-widget';
import '@brainbase-labs/chat-widget/styles.css';

function App() {
  return (
    <ChatWidget
      embedId="your-embed-id-here"
      onSessionEnd={(session) => console.log('Session ended:', session)}
    />
  );
}
```

## Mock Mode for Development

Test the UI without a backend connection:

```tsx
import { ChatWidget } from '@brainbase-labs/chat-widget';
import '@brainbase-labs/chat-widget/styles.css';

function App() {
  return (
    <ChatWidget
      embedId="demo"
      mockMode={true}
      defaultOpen={true}
      agentName="Dev Assistant"
    />
  );
}
```

## Custom Mock Responses

```tsx
<ChatWidget
  embedId="demo"
  mockMode={true}
  mockResponses={[
    {
      trigger: /order|status/i,
      response: "Let me look up your order...",
      toolCalls: [
        {
          name: 'lookup_order',
          arguments: { orderId: '12345' },
          result: { status: 'shipped' }
        }
      ]
    },
    {
      trigger: /.*/,
      response: "I'm here to help! Ask me anything.",
      delay: 500
    }
  ]}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `embedId` | `string` | Required | The embed ID from your Brainbase Labs deployment |
| `apiBaseUrl` | `string` | Production URL | API base URL for the Brainbase Labs API |
| `mockMode` | `boolean` | `false` | Enable mock mode for UI development |
| `mockResponses` | `MockResponse[]` | Default responses | Custom mock responses |
| `position` | `'bottom-right' \| 'bottom-left' \| 'inline'` | `'bottom-right'` | Widget position |
| `defaultOpen` | `boolean` | `false` | Whether widget starts open |
| `primaryColor` | `string` | `'#1a1a2e'` | Primary theme color (hex) |
| `agentName` | `string` | From deployment | Agent display name |
| `className` | `string` | - | Custom CSS class |
| `onSessionStart` | `(sessionId: string) => void` | - | Session start callback |
| `onSessionEnd` | `(session: Session) => void` | - | Session end callback |
| `onMessage` | `(message: Message) => void` | - | Message callback |
| `onError` | `(error: Error) => void` | - | Error callback |

## Theming

The widget uses CSS custom properties for theming. Override them in your CSS:

```css
:root {
  /* Primary brand color */
  --bb-primary-color: #1a1a2e;
  
  /* Accent color for highlights */
  --bb-accent-color: #6366f1;
  
  /* Background colors */
  --bb-surface-bg: #ffffff;
  --bb-surface-secondary: #f8f9fb;
  
  /* Text colors */
  --bb-text-primary: #1a1a2e;
  --bb-text-secondary: #6b7280;
  
  /* Message bubbles */
  --bb-user-message-bg: var(--bb-primary-color);
  --bb-user-message-text: #ffffff;
  --bb-assistant-message-bg: var(--bb-surface-secondary);
  --bb-assistant-message-text: var(--bb-text-primary);
  
  /* Widget dimensions */
  --bb-widget-width: 400px;
  --bb-widget-height: 600px;
}
```

## Advanced Usage

### Using the Chat Hook

For custom UI implementations:

```tsx
import { useChat, createMockAPIClient } from '@brainbase-labs/chat-widget';

function CustomChat() {
  const mockClient = createMockAPIClient();
  
  const chat = useChat({
    config: {
      embedId: 'demo',
      deploymentId: 'mock',
      workerId: 'mock',
      flowId: 'mock',
    },
    apiClient: mockClient,
    mockMode: true,
  });

  return (
    <div>
      {chat.messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      <input
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            chat.sendMessage(e.currentTarget.value);
            e.currentTarget.value = '';
          }
        }}
      />
    </div>
  );
}
```

### Inline Mode

Embed the chat directly in your page layout instead of as a floating widget:

```tsx
<ChatWidget
  embedId="your-embed-id"
  position="inline"
  defaultOpen={true}
/>
```

## TypeScript

Full TypeScript support with exported types:

```tsx
import type {
  ChatWidgetProps,
  Message,
  Session,
  ToolCall,
  DeploymentConfig,
} from '@brainbase-labs/chat-widget';
```

## Development

```bash
# Install dependencies
npm install

# Run Storybook for development
npm run storybook

# Build the library
npm run build

# Type check
npm run typecheck

# Lint
npm run lint
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

## License

MIT © [Brainbase Labs](https://brainbaselabs.com)
