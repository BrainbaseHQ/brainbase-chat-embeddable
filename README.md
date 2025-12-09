# @brainbase/chat-widget

A React chat widget for embedding Brainbase AI agents in your applications.

## Installation

```bash
npm install @brainbase/chat-widget
# or
yarn add @brainbase/chat-widget
# or
pnpm add @brainbase/chat-widget
```

## Quick Start

```tsx
import { ChatWidget } from '@brainbase/chat-widget';
import '@brainbase/chat-widget/styles.css';

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
import { ChatWidget } from '@brainbase/chat-widget';
import '@brainbase/chat-widget/styles.css';

function App() {
  return (
    <ChatWidget
      embedId="demo"
      mockMode={true}
      defaultOpen={true}
      agentName="Dev Assistant"
      welcomeMessage="Mock mode enabled! Test the UI without a backend."
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
| `embedId` | `string` | Required | The embed ID from your Brainbase deployment |
| `apiBaseUrl` | `string` | Production URL | API base URL for the Brainbase API |
| `mockMode` | `boolean` | `false` | Enable mock mode for UI development |
| `mockResponses` | `MockResponse[]` | Default responses | Custom mock responses |
| `position` | `'bottom-right' \| 'bottom-left' \| 'inline'` | `'bottom-right'` | Widget position |
| `defaultOpen` | `boolean` | `false` | Whether widget starts open |
| `primaryColor` | `string` | `'#1a1a2e'` | Primary theme color |
| `agentName` | `string` | From deployment | Agent display name |
| `welcomeMessage` | `string` | From deployment | Initial welcome message |
| `className` | `string` | - | Custom CSS class |
| `onSessionStart` | `(sessionId: string) => void` | - | Session start callback |
| `onSessionEnd` | `(session: Session) => void` | - | Session end callback |
| `onMessage` | `(message: Message) => void` | - | Message callback |
| `onError` | `(error: Error) => void` | - | Error callback |

## Theming

The widget uses CSS custom properties for theming. Override them in your CSS:

```css
:root {
  --bb-primary-color: #your-color;
  --bb-accent-color: #your-accent;
  --bb-surface-bg: #your-background;
  /* ... see variables.css for all options */
}
```

## Advanced Usage

### Using the Chat Hook

For custom UI implementations:

```tsx
import { useChat, createMockAPIClient } from '@brainbase/chat-widget';

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
      <button onClick={() => chat.sendMessage('Hello!')}>
        Send
      </button>
    </div>
  );
}
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
```

## License

MIT
