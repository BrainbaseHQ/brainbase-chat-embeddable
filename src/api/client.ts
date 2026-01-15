import type {
  BrainbaseAPIClient,
  DeploymentConfig,
  SendMessageParams,
} from '../types';

export const DEFAULT_ENGINE_URL = 'https://chat-embed-deployment.onrender.com';
//export const DEFAULT_ENGINE_URL = 'http://localhost:8003';

export function createAPIClient(
  engineBaseUrl: string = DEFAULT_ENGINE_URL
): BrainbaseAPIClient {
  return {
    async getDeploymentConfig(embedId: string): Promise<DeploymentConfig> {
      // GET /chat/config/{embed_id} - Public endpoint on the messaging server
      const res = await fetch(`${engineBaseUrl}/chat/config/${embedId}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch deployment config: ${res.status}`);
      }

      const data = await res.json();

      return {
        embedId: data.embedId,
        // Note: The public config endpoint doesn't expose internal IDs
        // These will be resolved server-side when sending messages
        deploymentId: '',
        workerId: '',
        flowId: '',
        welcomeMessage: data.welcomeMessage,
        agentName: data.agentName,
        agentLogoUrl: data.agentLogoUrl,
        primaryColor: data.primaryColor,
        styling: data.styling,
      };
    },

    async sendMessage(params: SendMessageParams): Promise<ReadableStream<Uint8Array>> {
      // POST /chat/message - SSE streaming endpoint
      const res = await fetch(`${engineBaseUrl}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embed_id: params.embedId,
          message: params.message,
          session_id: params.sessionId || undefined,
          metadata: params.metadata,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to send message: ${res.status} - ${errorText}`);
      }

      if (!res.body) {
        throw new Error('No response stream available');
      }

      return res.body;
    },
  };
}

