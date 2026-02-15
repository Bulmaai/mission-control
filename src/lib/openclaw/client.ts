import { EventEmitter } from "events";

interface OpenClawMessage {
  type?: string;
  id?: string | number;
  method?: string;
  params?: Record<string, unknown>;
  event?: string;
  ok?: boolean;
  error?: { message: string };
  payload?: unknown;
  result?: unknown;
}

interface OpenClawSessionInfo {
  key: string;
  agentId?: string;
  channel?: string;
  peer?: string;
  createdAt: string;
  lastActivityAt: string;
  messageCount: number;
}

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || "ws://127.0.0.1:18789";
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || "";

export class OpenClawClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageId = 0;
  private pendingRequests = new Map<string | number, { 
    resolve: (value: unknown) => void; 
    reject: (error: Error) => void 
  }>();
  private connected = false;
  private authenticated = false;
  private connecting: Promise<void> | null = null;
  private autoReconnect = true;
  private url: string;
  private token: string;

  constructor(url: string = GATEWAY_URL, token: string = GATEWAY_TOKEN) {
    super();
    this.url = url;
    this.token = token;
    this.on("error", () => {});
  }

  async connect(): Promise<void> {
    if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.connecting) {
      return this.connecting;
    }

    this.connecting = new Promise((resolve, reject) => {
      try {
        if (this.ws) {
          this.ws.onclose = null;
          this.ws.onerror = null;
          this.ws.onmessage = null;
          this.ws.onopen = null;
          if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
            this.ws.close();
          }
          this.ws = null;
        }

        const wsUrl = new URL(this.url);
        if (this.token) {
          wsUrl.searchParams.set("token", this.token);
        }
        
        console.log("[OpenClaw] Connecting to:", wsUrl.toString().replace(/token=[^&]+/, "token=***"));
        
        this.ws = new WebSocket(wsUrl.toString());

        const connectionTimeout = setTimeout(() => {
          if (!this.connected) {
            this.ws?.close();
            reject(new Error("Connection timeout"));
          }
        }, 10000);

        this.ws.onopen = async () => {
          clearTimeout(connectionTimeout);
          console.log("[OpenClaw] WebSocket opened, waiting for challenge...");
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          const wasConnected = this.connected;
          this.connected = false;
          this.authenticated = false;
          this.connecting = null;
          this.emit("disconnected");
          console.log(`[OpenClaw] Disconnected (code: ${event.code}, reason: "${event.reason}")`);
          
          if (this.autoReconnect && wasConnected) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error("[OpenClaw] WebSocket error");
          this.emit("error", error);
          if (!this.connected) {
            this.connecting = null;
            reject(new Error("Failed to connect to OpenClaw Gateway"));
          }
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data as string) as OpenClawMessage;
            this.handleMessage(data, resolve, reject);
          } catch (err) {
            console.error("[OpenClaw] Failed to parse message:", err);
          }
        };
      } catch (err) {
        this.connecting = null;
        reject(err);
      }
    });

    return this.connecting;
  }

  private handleMessage(
    data: OpenClawMessage, 
    resolve: () => void, 
    reject: (error: Error) => void
  ): void {
    // Handle challenge-response authentication
    if (data.type === "event" && data.event === "connect.challenge") {
      console.log("[OpenClaw] Challenge received, responding...");
      const requestId = crypto.randomUUID();
      const response = {
        type: "req",
        id: requestId,
        method: "connect",
        params: {
          minProtocol: 3,
          maxProtocol: 3,
          client: {
            id: "mission-control",
            version: "1.0.0",
            platform: "web",
            mode: "ui"
          },
          auth: {
            token: this.token
          }
        }
      };

      this.pendingRequests.set(requestId, {
        resolve: () => {
          this.connected = true;
          this.authenticated = true;
          this.connecting = null;
          this.emit("connected");
          console.log("[OpenClaw] Authenticated successfully");
          resolve();
        },
        reject: (error: Error) => {
          this.connecting = null;
          this.ws?.close();
          reject(new Error(`Authentication failed: ${error.message}`));
        }
      });

      this.ws!.send(JSON.stringify(response));
      return;
    }

    // Handle RPC responses
    if (data.type === "res" && data.id !== undefined) {
      const pending = this.pendingRequests.get(data.id);
      if (pending) {
        this.pendingRequests.delete(data.id);
        if (data.ok === false && data.error) {
          pending.reject(new Error(data.error.message));
        } else {
          pending.resolve(data.payload ?? data.result);
        }
        return;
      }
    }

    // Handle events/notifications
    if (data.method || data.event) {
      this.emit("notification", data);
      this.emit(data.method || data.event || "message", data.params || data);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || !this.autoReconnect) return;

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      if (!this.autoReconnect) return;

      console.log("[OpenClaw] Attempting reconnect...");
      try {
        await this.connect();
      } catch {
        this.scheduleReconnect();
      }
    }, 10000);
  }

  async call<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> {
    if (!this.ws || !this.connected || !this.authenticated) {
      throw new Error("Not connected to OpenClaw Gateway");
    }

    const id = crypto.randomUUID();
    const message = { type: "req", id, method, params };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve: resolve as (value: unknown) => void, reject });

      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${method}`));
        }
      }, 30000);

      this.ws!.send(JSON.stringify(message));
    });
  }

  // Session management
  async listSessions(): Promise<OpenClawSessionInfo[]> {
    return this.call<OpenClawSessionInfo[]>("sessions.list");
  }

  async sendMessage(sessionKey: string, content: string): Promise<void> {
    await this.call("sessions.send", { sessionKey, content });
  }

  disconnect(): void {
    this.autoReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.authenticated = false;
    this.connecting = null;
  }

  isConnected(): boolean {
    return this.connected && this.authenticated && this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
let clientInstance: OpenClawClient | null = null;

export function getOpenClawClient(): OpenClawClient {
  if (!clientInstance) {
    clientInstance = new OpenClawClient();
  }
  return clientInstance;
}
