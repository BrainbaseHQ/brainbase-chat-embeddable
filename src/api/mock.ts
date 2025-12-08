import type { DeploymentConfig, MockResponse, SSEEvent } from '../types';

export interface MockAPIClient {
  getDeploymentConfig(embedId: string): Promise<DeploymentConfig>;
  sendMessage(message: string): AsyncGenerator<SSEEvent>;
  startSession(): Promise<void>;
  endSession(): Promise<void>;
}

const DEFAULT_MOCK_CONFIG: DeploymentConfig = {
  embedId: 'mock-embed-id',
  deploymentId: 'mock-deployment-id',
  workerId: 'mock-worker-id',
  flowId: 'mock-flow-id',
  welcomeMessage: 'Hello! How can I help you today?',
  agentName: 'AI Assistant',
  agentLogoUrl: undefined,
  primaryColor: '#6366f1',
  styling: {},
};

const DEFAULT_MOCK_RESPONSES: MockResponse[] = [
  {
    trigger: /hello|hi|hey/i,
    response:
      "Hello! I'm a demo AI assistant. How can I help you today?",
    delay: 500,
  },
  {
    trigger: /weather/i,
    response:
      "I'd check the weather for you, but I'm in mock mode! In production, I could use a weather API.",
    delay: 800,
    toolCalls: [
      {
        name: 'get_weather',
        arguments: { location: 'San Francisco' },
        result: { temperature: 72, condition: 'sunny' },
      },
    ],
  },
  {
    trigger: /help|support/i,
    response:
      "I'm here to help! You can ask me questions, and I'll do my best to assist you. In production, I'd be connected to your Brainbase AI agent with full capabilities.",
    delay: 600,
  },
  {
    trigger: /pricing|cost|price/i,
    response:
      "For pricing information, I'd typically check our database or connect you with the sales team. This is a mock response demonstrating how I'd handle pricing questions.",
    delay: 700,
    toolCalls: [
      {
        name: 'lookup_pricing',
        arguments: { plan: 'all' },
        result: {
          plans: [
            { name: 'Starter', price: '$29/mo' },
            { name: 'Pro', price: '$99/mo' },
          ],
        },
      },
    ],
  },
  {
    trigger: /.*/,
    response:
      "I'm running in mock mode. This is a simulated response to demonstrate the chat UI. In production, I'd be connected to your Brainbase AI agent!",
    delay: 1000,
  },
];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockAPIClient(
  customConfig?: Partial<DeploymentConfig>,
  customResponses?: MockResponse[]
): MockAPIClient {
  const config = { ...DEFAULT_MOCK_CONFIG, ...customConfig };
  const responses = customResponses ?? DEFAULT_MOCK_RESPONSES;

  return {
    async getDeploymentConfig(_embedId: string): Promise<DeploymentConfig> {
      // Simulate network delay
      await delay(300);
      return config;
    },

    async *sendMessage(message: string): AsyncGenerator<SSEEvent> {
      // Find matching response
      const matchedResponse =
        responses.find((r) =>
          typeof r.trigger === 'string'
            ? message.toLowerCase().includes(r.trigger.toLowerCase())
            : r.trigger.test(message)
        ) ?? responses[responses.length - 1];

      // Simulate typing delay
      await delay(matchedResponse.delay ?? 500);

      // Emit tool calls if any
      if (matchedResponse.toolCalls) {
        for (const tc of matchedResponse.toolCalls) {
          yield {
            type: 'function_call',
            data: {
              name: tc.name,
              arguments: tc.arguments,
              status: 'pending',
            },
            timestamp: Date.now(),
          };
          await delay(300);
          yield {
            type: 'function_call',
            data: {
              name: tc.name,
              result: tc.result,
              status: 'completed',
            },
            timestamp: Date.now(),
          };
          await delay(200);
        }
      }

      // Stream the response word by word
      const words = matchedResponse.response.split(' ');
      let accumulated = '';

      for (const word of words) {
        accumulated += (accumulated ? ' ' : '') + word;
        yield {
          type: 'say',
          data: { text: accumulated, partial: true },
          timestamp: Date.now(),
        };
        await delay(30 + Math.random() * 40);
      }

      // Final complete message
      yield {
        type: 'say',
        data: { text: matchedResponse.response, partial: false },
        timestamp: Date.now(),
      };

      yield { type: 'completed', data: {}, timestamp: Date.now() };
    },

    async startSession(): Promise<void> {
      await delay(100);
      console.log('[Mock] Session started');
    },

    async endSession(): Promise<void> {
      await delay(100);
      console.log('[Mock] Session ended');
    },
  };
}

