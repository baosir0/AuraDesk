

export interface MessageClient {
  postMessage(message: any): void;
  onMessage(handler: (message: any) => void): void;
  close(): void;
}

// WebSocket 消息格式
export interface WebSocketMessage {
    command: string;
    data: any;
}

// 服务器返回的消息格式
export interface WebSocketResponse {
    result?: any;
    timeCost?: number;
    error?: string;
}

export interface PostMessageble {
    postMessage(message: any): void;
}