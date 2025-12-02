import { isReactive } from 'vue';
import { v4 as uuidv4 } from 'uuid';





export interface CommandMessage {
	command: string;
	data?: unknown;
	callbackId?: string;
}

export interface RestFulResponse<T = any> {
	_id?: string
	code: number;
	msg: T;

	error?: string;
}

export type CommandHandler = (data: any) => void;

interface AddCommandListenerOption {
	once: boolean
}

export interface ICommandRequestData {
	clientId?: string;
	[key: string]: any;
}

export class MessageBridge {
	private ws: WebSocket | null = null;
	private handlers = new Map<string, Set<CommandHandler>>();
	private isConnected: Promise<boolean> | null = null;
	private wsUrl: string;

	constructor(setupSignature: string) {
		if (typeof setupSignature !== 'string') {
			throw new Error('MessageBridge requires a WebSocket URL string.');
		}
		this.wsUrl = setupSignature;
		this.setupWebSocket();
	}

	public setupWebSocket() {
		console.log(`Connecting to WebSocket: ${this.wsUrl}`);

		this.ws = new WebSocket(this.wsUrl);
		const ws = this.ws;

		this.isConnected = new Promise<boolean>((resolve, reject) => {
			ws.onopen = () => {
				console.log('WebSocket connection opened.');
				resolve(true);
			};

			ws.onmessage = (event) => {
				try {
					const message = JSON.parse(event.data) as CommandMessage;
					this.dispatchMessage(message);
				} catch (err) {
					console.error('Message parse error:', err);
				}
			};

			ws.onerror = (err) => {
				console.error('WebSocket error occurred:', err);
				resolve(false); 
			};

			ws.onclose = () => {
				console.warn('WebSocket connection closed.');
				resolve(false);
			};
			this.postMessage = (message) => {
				if (this.ws?.readyState === WebSocket.OPEN) {
					this.ws.send(JSON.stringify(message));
				}
			};
		});

		return this.isConnected;
	}

	public async awaitForConnection() {
		if (this.isConnected) {
			return await this.isConnected;
		}
		return false;
	}

	/**
	 * @description 对 message 发起调度，根据 command 类型获取调取器
	 * @param message 
	 */
	private dispatchMessage(message: CommandMessage) {
		const command = message.command;
		const data = message.data;

		const handlers = this.handlers.get(command) || new Set();
		handlers.forEach(handler => handler(data));
	}

	public postMessage(message: CommandMessage) {
		throw new Error('PostMessage not initialized. WebSocket not yet open.');
	}

	/**
	 * @description 注册一个命令的执行器（支持一次性或持久监听）
	 */
	public addCommandListener(
		command: string,
		commandHandler: CommandHandler,
		option: AddCommandListenerOption
	): () => boolean {
		if (!this.handlers.has(command)) {
			this.handlers.set(command, new Set<CommandHandler>());
		}
		const commandHandlers = this.handlers.get(command)!;

		const wrapperCommandHandler = option.once ? (data: any) => {
			commandHandler(data);
			commandHandlers.delete(wrapperCommandHandler);
		} : commandHandler;

		commandHandlers.add(wrapperCommandHandler);
		return () => commandHandlers.delete(wrapperCommandHandler);
	}


	private deserializeReactiveData(data: any) {
		if (typeof isReactive === 'function' && isReactive(data)) {
			return JSON.parse(JSON.stringify(data));
		}


		for (const key in data) {
			if (typeof isReactive === 'function' && isReactive(data[key])) {
				data[key] = JSON.parse(JSON.stringify(data[key]));
			}
		}

		return data;
	}

	/**
	 * @description 
	 * @param command 
	 * @param data 
	 * @returns Promise<RestFulResponse<T>>
	 */
	public async commandRequest<T = any>(command: string, data?: ICommandRequestData): Promise<RestFulResponse<T>> {
		const _id = uuidv4();
		const _ = await this.awaitForConnection()

		return new Promise<RestFulResponse<T>>((resolve, reject) => {
			if (this.ws?.readyState !== WebSocket.OPEN) {
				return reject({ code: 503, error: 'WebSocket not connected or open.' });
			}

			const handler = this.addCommandListener(command, (data: RestFulResponse) => {

				if (data._id === _id) {
					handler();

					if (data.code >= 200 && data.code < 300) {
						resolve(data as RestFulResponse<T>);
					} else {

						const errorMsg = data.error || `Command failed with code ${data.code}`;
						reject({ code: data.code, error: errorMsg, response: data });
					}
				} else if (data._id === undefined) {

					console.warn('Received message without ID, treating as broadcast or incomplete: ' + JSON.stringify(data, null, 2));
				}
			}, { once: false });


			this.postMessage({
				command,
				data: this.deserializeReactiveData({
					_id,
					...data
				})
			});
		});
	}

	public destroy() {
		this.ws?.close();
		this.handlers.clear();
	}
}

let messageBridge: MessageBridge;


export function createMessageBridge(setupSignature: string) {
	messageBridge = new MessageBridge(setupSignature);
	return messageBridge;
}


export function useMessageBridge() {
	if (!messageBridge) {
		messageBridge = new MessageBridge(process.env.VUE_APP_WEBSOCKET_URL as string);
	}
	const bridge = messageBridge;

	return bridge;
}
