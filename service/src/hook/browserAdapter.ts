import { MessageClient, WebSocketMessage } from './adapter.dto';
import { WebSocket } from 'ws';

export type MessageHandler = (message: any) => void;

export class browserAdapter implements MessageClient{
    private ws: WebSocket;
    private messageHandlers: Set<MessageHandler>
  
    constructor(ws: WebSocket) {
        this.ws = ws;
        this.messageHandlers = new Set()
        this.ws.on('message', (rawData: Buffer | string) => {
            try {
                const message: any = JSON.parse(rawData.toString());
                this.messageHandlers.forEach((handler) => handler(message));
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        });
    }
    
    postMessage(message: WebSocketMessage): void {
        this.ws.send(JSON.stringify(message));
    }
    
    onMessage(callback: MessageHandler): { dispose: () => void } {
        this.messageHandlers.add(callback);
        return {
            dispose: () => this.messageHandlers.delete(callback),
        };
    }
    
    close(): void {
        this.ws.close();
    }
}