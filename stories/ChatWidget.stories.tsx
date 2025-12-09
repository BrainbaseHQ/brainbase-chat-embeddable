import type { Meta, StoryObj } from '@storybook/react';
import { ChatWidget } from '../src';

const meta: Meta<typeof ChatWidget> = {
  title: 'Components/ChatWidget',
  component: ChatWidget,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    position: {
      control: 'select',
      options: ['bottom-right', 'bottom-left', 'inline'],
    },
    primaryColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof ChatWidget>;

// Default mock mode story
export const Default: Story = {
  args: {
    embedId: 'demo',
    mockMode: false,
    defaultOpen: true,
    agentName: 'AI Assistant',
    welcomeMessage:
      'Hello! How can I help you today? Try saying "hello" or ask about the "weather"!',
    primaryColor: '#1a1a2e',
  },
};

// Floating button (collapsed)
export const FloatingButton: Story = {
  args: {
    embedId: 'demo',
    mockMode: true,
    defaultOpen: false,
    agentName: 'Support Bot',
    primaryColor: '#1a1a2e',
  },
};

// Custom colors
export const CustomColors: Story = {
  args: {
    embedId: 'demo',
    mockMode: true,
    defaultOpen: true,
    agentName: 'Sales Bot',
    welcomeMessage: 'Welcome to ACME Inc! How can I help you today?',
    primaryColor: '#059669',
    mockResponses: [
      {
        trigger: /pricing|cost|price/i,
        response:
          'Our plans start at $29/month. Would you like me to walk you through our pricing tiers?',
        delay: 600,
      },
      {
        trigger: /demo|trial/i,
        response:
          "I'd be happy to set up a demo for you! Let me check our calendar...",
        delay: 800,
        toolCalls: [
          {
            name: 'check_calendar',
            arguments: { duration: 30 },
            result: { available_slots: ['Tomorrow 2pm', 'Thursday 10am'] },
          },
        ],
      },
      {
        trigger: /.*/,
        response:
          "That's a great question! Let me connect you with our team for more details.",
        delay: 500,
      },
    ],
  },
};

// Bottom left position
export const BottomLeft: Story = {
  args: {
    ...Default.args,
    position: 'bottom-left',
  },
};

// Inline mode (embedded in page)
export const Inline: Story = {
  args: {
    embedId: "demo",
    mockMode: true,
    position: 'inline',
    defaultOpen: true,
    agentName: 'Help Assistant',
    welcomeMessage: 'Ask me anything about our product!',
    primaryColor: '#4f46e5',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 400, margin: '40px auto', padding: 20 }}>
        <h2 style={{ marginBottom: 20, fontFamily: 'system-ui' }}>
          Embedded Chat Widget
        </h2>
        <Story />
      </div>
    ),
  ],
};

// Purple theme
export const PurpleTheme: Story = {
  args: {
    embedId: 'demo',
    mockMode: true,
    defaultOpen: true,
    agentName: 'AI Companion',
    welcomeMessage: 'Hey there! 👋 How can I assist you today?',
    primaryColor: '#7c3aed',
  },
};

// Dark navy theme
export const NavyTheme: Story = {
  args: {
    embedId: 'demo',
    mockMode: true,
    defaultOpen: true,
    agentName: 'Enterprise AI',
    welcomeMessage: 'Welcome to Enterprise Support. How may I help you?',
    primaryColor: '#0f172a',
  },
};

// Tool calls demo
export const WithToolCalls: Story = {
  args: {
    embedId: 'demo',
    mockMode: true,
    defaultOpen: true,
    agentName: 'Action Bot',
    welcomeMessage:
      'I can perform actions for you! Try asking about "order status" or "weather".',
    primaryColor: '#1a1a2e',
    mockResponses: [
      {
        trigger: /order|status/i,
        response:
          'I found your order #12345. It was shipped yesterday and should arrive by Friday!',
        delay: 800,
        toolCalls: [
          {
            name: 'lookup_order',
            arguments: { orderId: '12345' },
            result: {
              status: 'shipped',
              carrier: 'FedEx',
              eta: 'Friday',
            },
          },
        ],
      },
      {
        trigger: /weather/i,
        response:
          "It's looking great today! 72°F and sunny in San Francisco. Perfect day to go outside!",
        delay: 700,
        toolCalls: [
          {
            name: 'get_weather',
            arguments: { location: 'San Francisco' },
            result: { temperature: 72, condition: 'sunny', humidity: 45 },
          },
        ],
      },
      {
        trigger: /.*/,
        response:
          'I can help you check order status or get weather information. Just ask!',
        delay: 500,
      },
    ],
  },
};

