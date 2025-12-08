import type {
  BrainbaseAPIClient,
  DeploymentConfig,
  StartSessionParams,
  SendMessageParams,
  EndSessionParams,
} from '../types';

const DEFAULT_API_URL = 'https://brainbase-monorepo-api.onrender.com';
const DEFAULT_ENGINE_URL = 'https://whatsapp-based-server.onrender.com';

export function createAPIClient(
  apiBaseUrl: string = DEFAULT_API_URL,
  engineBaseUrl: string = DEFAULT_ENGINE_URL
): BrainbaseAPIClient {
  return {
    async getDeploymentConfig(embedId: string): Promise<DeploymentConfig> {
      // GET /api/workers/deployments/chat-embed/by-embed/{embedId}
      const res = await fetch(
        `${apiBaseUrl}/api/workers/deployments/chat-embed/by-embed/${embedId}`
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch deployment config: ${res.status}`);
      }

      const data = await res.json();

      return {
        embedId: data.embedId,
        deploymentId: data.id,
        workerId: data.workerId,
        flowId: data.flowId,
        welcomeMessage: data.welcomeMessage,
        agentName: data.agentName,
        agentLogoUrl: data.agentLogoUrl,
        primaryColor: data.primaryColor,
        styling: data.styling,
      };
    },

    async startSession(params: StartSessionParams): Promise<void> {
      // POST /api/workers/{workerId}/deploymentLogs/chat-embed
      // with event: 'session_started'
      const res = await fetch(
        `${apiBaseUrl}/api/workers/${params.workerId}/deploymentLogs/chat-embed`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'session_started',
            sessionId: params.sessionId,
            deploymentId: params.deploymentId,
            flowId: params.flowId,
            userAgent: params.userAgent,
            originUrl: params.originUrl,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to start session: ${res.status}`);
      }
    },

    async sendMessage(params: SendMessageParams): Promise<ReadableStream<Uint8Array>> {
      // POST to engine SSE endpoint
      const res = await fetch(`${engineBaseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: params.sessionId,
          deployment_id: params.deploymentId,
          worker_id: params.workerId,
          flow_id: params.flowId,
          message: params.message,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to send message: ${res.status}`);
      }

      if (!res.body) {
        throw new Error('No response stream available');
      }

      return res.body;
    },

    async endSession(params: EndSessionParams): Promise<void> {
      // POST /api/workers/{workerId}/deploymentLogs/chat-embed
      // with event: 'session_ended'
      const res = await fetch(
        `${apiBaseUrl}/api/workers/${params.workerId}/deploymentLogs/chat-embed`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'session_ended',
            sessionId: params.sessionId,
            messages: params.messages,
            toolCalls: params.toolCalls,
            messageCount: params.messageCount,
            startTime: params.startTime,
            endTime: params.endTime,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to end session: ${res.status}`);
      }
    },
  };
}

