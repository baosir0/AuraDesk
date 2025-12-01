import { CommandHandler, ICommandRequestData, RestFulResponse, useMessageBridge } from "@/api/message-bridge";

import OpenAI from 'openai';


export function getToolList(clientId: string): Promise<RestFulResponse<any>> {
    const bridge = useMessageBridge();
    const requestData: ICommandRequestData = {
        clientId: clientId
    };
    return bridge.commandRequest('tools/list', requestData);
}

export function llmChat(
    data: ICommandRequestData,
    onChunkReceived: (chunk: OpenAI.Chat.Completions.ChatCompletionChunk) => void,
    onError: (error: any) => void
): Promise<void> {
    const bridge = useMessageBridge();
    const sessionId = data.sessionId;

    if (!sessionId) {
        return Promise.reject(new Error("sessionId is required for streaming chat."));
    }

    return new Promise<void>((resolve, reject) => {
        // --- 1. 定义消息处理函数 ---

        // A. 处理数据块 (Chunk) 消息
        const chunkHandler: CommandHandler = (msgData) => {
            if (msgData?.sessionId === sessionId && msgData.code === 200 && msgData.msg?.chunk) {
                // 调用外部提供的回调函数更新 UI
                onChunkReceived(msgData.msg.chunk);
            }
        };

        // B. 处理流结束 (Done) 消息
        const doneHandler: CommandHandler = (msgData) => {
            if (msgData?.sessionId === sessionId) {
                // 收到 Done 消息，清理所有监听器并解析 Promise
                cleanupListeners();
                resolve();
            }
        };

        // C. 处理错误消息
        const errorHandler: CommandHandler = (msgData) => {
            if (msgData?.sessionId === sessionId && msgData.code === 500) {
                // 调用外部提供的错误回调
                onError(msgData.msg);
                cleanupListeners();
                reject(new Error(`LLM Stream Error: ${JSON.stringify(msgData.msg)}`));
            }
        };

        // --- 2. 注册监听器 ---
        
        // 注册流式数据监听器
        const removeChunkListener = bridge.addCommandListener(
            'llm/chat/completions/chunk',
            chunkHandler,
            { once: false }
        );

        // 注册流结束监听器
        const removeDoneListener = bridge.addCommandListener(
            'llm/chat/completions/done',
            doneHandler,
            { once: false }
        );
        
        // 注册错误监听器
        const removeErrorListener = bridge.addCommandListener(
            'llm/chat/completions/error',
            errorHandler,
            { once: false }
        );

        // 清理函数
        const cleanupListeners = () => {
            removeChunkListener();
            removeDoneListener();
            removeErrorListener();
        };

        // --- 3. 发送启动消息 (单向) ---
        // 这里的 data 结构直接对应后端的 RequestData 接口
        bridge.postMessage({
            command: 'llm/chat/completions', // 对应您的 Controller 路径
            data: data
        });
    });
}