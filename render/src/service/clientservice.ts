import { CommandHandler, ICommandRequestData, RestFulResponse, useMessageBridge } from "@/api/message-bridge";

import OpenAI from 'openai';

interface IToolCallResult {
    tool_call_id: string; // 必须与 LLM 返回的一致
    content: string;      // 工具的输出内容（JSON字符串或纯文本）
}


export function getToolList(clientId: string): Promise<RestFulResponse<any>> {
    const bridge = useMessageBridge();
    const requestData: ICommandRequestData = {
        clientId: clientId
    };
    return bridge.commandRequest('tools/list', requestData);
}

export async function llmChat(
    data: ICommandRequestData,
    onChunkReceived: (chunk: OpenAI.Chat.Completions.ChatCompletionChunk) => void,
    onError: (error: any) => void
): Promise<void> {
    
    const bridge = useMessageBridge();
    const sessionId = data.sessionId;

    if (!sessionId) {
        return Promise.reject(new Error("sessionId is required for streaming chat."));
    }

    // 完整的消息历史，用于对话重试
    let messages = data.messages; 
    let currentRequestData = { ...data };

    // --- 辅助函数：执行工具调用（通过 MCP 协议） ---
    const executeToolCalls = async (toolCalls: NonNullable<OpenAI.Chat.Completions.ChatCompletionChunk['choices'][0]['delta']['tool_calls']>) => {
        
        // 确保工具调用是完整的，且有 ID 和 function name
        const validToolCalls = toolCalls.filter(tc => tc.function?.name && tc.id);

        if (validToolCalls.length === 0) return;

        // 【1. 构造工具执行请求 (MCP 协议格式)】
        const toolRequestData = {
            sessionId: sessionId,
            tool_calls: validToolCalls.map(tc => ({
                toolCallId: tc.id!,
                toolName: tc.function!.name, 
                // 确保参数是合法的 JSON，即使 LLM 流中有微小的错误，这里也可能抛出
                toolArgs: JSON.parse(tc.function!.arguments||''), 
            }))
        };
        
        // 【2. 发送 MCP 请求并等待结果】
        // ⚠️ 假设 bridge.request 是一个同步/Promise 方法，用于发送请求并等待响应。
        // 如果您的 bridge 只有 postMessage，您需要在此处添加临时监听器来等待结果。
        const response = await bridge.commandRequest('llm/tool/execute', toolRequestData); 

        if (response.code !== 200 || !response.msg?.results) {
            throw new Error(`MCP Tool execution failed: ${JSON.stringify(response.msg)}`);
        }
        
        // 【3. 转换结果并添加到消息历史】
        const toolResults: IToolCallResult[] = response.msg.results;
        
        // 构造 LLM 的响应消息 (Role = assistant)
        messages.push({ 
            role: 'assistant', 
            content: null, 
            tool_calls: validToolCalls.map(tc => ({ id: tc.id!, function: tc.function!, type: 'function' })) 
        } as any); 
        
        // 构造工具的结果消息 (Role = tool)
        const toolMessages = toolResults.map(result => ({
            role: 'tool',
            content: result.content,
            tool_call_id: result.tool_call_id,
        }));
        
        // 将工具结果加入历史，用于下一次 LLM 对话
        messages.push(...toolMessages as any);
    };


    // --- 循环执行 Agent Loop ---
    let loopControl: { toolCalls: any | null; isDone: boolean } = { toolCalls: null, isDone: false };

    do {
        try {
            // 1. 发起 LLM 对话 (单次流)
            loopControl = await _streamChat(
                bridge,
                { ...currentRequestData, messages: messages }, // 携带更新后的消息历史
                sessionId,
                onChunkReceived,
                onError
            );

            if (loopControl.toolCalls) {
                // 2. 收到工具调用：执行工具
                await executeToolCalls(loopControl.toolCalls);
                
                // 循环将继续
            }

        } catch (error) {
            // 捕获 _streamChat 或 executeToolCalls 中的错误
            onError(error);
            return Promise.reject(error);
        }

    } while (loopControl.toolCalls && !loopControl.isDone);
    
    // 最终完成
}

function _streamChat(
    bridge: ReturnType<typeof useMessageBridge>,
    data: ICommandRequestData,
    sessionId: string,
    onChunkReceived: (chunk: OpenAI.Chat.Completions.ChatCompletionChunk) => void,
    onError: (error: any) => void
): Promise<{ 
    toolCalls: OpenAI.Chat.Completions.ChatCompletionChunk['choices'][0]['delta']['tool_calls'] | null; 
    isDone: boolean 
}> {
    
    // 聚合LLM流中的工具调用信息
    let aggregatedToolCalls: OpenAI.Chat.Completions.ChatCompletionChunk['choices'][0]['delta']['tool_calls'] = [];
    let streamEndedByToolCall = false; // 标记流是否因工具调用而中断

    return new Promise((resolve, reject) => {
        
        const cleanupListeners = () => {
            removeChunkListener();
            removeDoneListener();
            removeErrorListener();
        };
        
        // --- 1. 定义消息处理函数 ---

        const chunkHandler: CommandHandler = (msgData) => {
            if (msgData?.sessionId === sessionId && msgData.code === 200 && msgData.msg?.chunk) {
                const chunk = msgData.msg.chunk as OpenAI.Chat.Completions.ChatCompletionChunk;

                const newToolCalls = chunk.choices?.[0]?.delta?.tool_calls;

                if (newToolCalls) {
                    
                    newToolCalls.forEach((newCall) => {
                        if (!newCall.id) return; 

                        const existingCall = aggregatedToolCalls.find(tc => tc.id === newCall.id);
                        const newFunction = newCall.function;
                        
                        if (existingCall) {
                            // 【修正点 A：初始化保证】
                            if (!existingCall.function) {
                                // 确保初始化，这样我们就可以在后续安全地使用 !
                                existingCall.function = { name: '', arguments: '' } as any; 
                            }
                            
                            // 【修正点 B：使用非空断言 (!) 来访问 function 字段】
                            // TypeScript 现在不再抱怨 existingCall.function 可能是 undefined
                            if (newFunction?.arguments) {
                                existingCall.function!.arguments += newFunction.arguments;
                            }

                            // 聚合 function.name
                            if (newFunction?.name && !existingCall.function!.name) {
                                existingCall.function!.name = newFunction.name;
                            }

                        } else {
                            // 添加新的 tool_call，初始化 function 对象
                            aggregatedToolCalls.push({ 
                                ...newCall, 
                                function: { 
                                    name: newFunction?.name || '', 
                                    arguments: newFunction?.arguments || '' 
                                } 
                            } as any);
                        }
                    });
                    
                    streamEndedByToolCall = true;
                }
                
                // 检查是否为文本 Chunk
                if (chunk.choices?.[0]?.delta?.content || (chunk.choices?.[0]?.delta?.content === '' && !streamEndedByToolCall)) {
                    if (streamEndedByToolCall) {
                        // 收到文本内容，且之前聚合了工具调用，立即中断流
                        cleanupListeners();
                        // 确保只返回那些有 function name 和 ID 的有效工具调用
                        const validToolCalls = aggregatedToolCalls.filter(tc => tc.function?.name && tc.id);
                        resolve({ 
                            toolCalls: validToolCalls.length > 0 ? validToolCalls : null, 
                            isDone: false 
                        });
                        return;
                    }
                    // 正常输出文本
                    onChunkReceived(chunk);
                }
            }
        };

        // B. 处理流结束 (Done) 消息
        const doneHandler: CommandHandler = (msgData) => {
            if (msgData?.sessionId === sessionId) {
                cleanupListeners();
                
                if (streamEndedByToolCall && aggregatedToolCalls.length > 0) {
                     // 即使收到 done，如果聚合了工具调用，也要按工具调用处理
                     const validToolCalls = aggregatedToolCalls.filter(tc => tc.function?.name && tc.id);
                     resolve({ 
                        toolCalls: validToolCalls.length > 0 ? validToolCalls : null, 
                        isDone: false 
                    });
                } else {
                     // 正常完成
                     resolve({ toolCalls: null, isDone: true });
                }
            }
        };

        // C. 处理错误消息
        const errorHandler: CommandHandler = (msgData) => {
            if (msgData?.sessionId === sessionId && msgData.code === 500) {
                onError(msgData.msg);
                cleanupListeners();
                reject(new Error(`LLM Stream Error: ${JSON.stringify(msgData.msg)}`));
            }
        };

        // --- 2. 注册监听器 ---
        const removeChunkListener = bridge.addCommandListener('llm/chat/completions/chunk', chunkHandler, { once: false });
        const removeDoneListener = bridge.addCommandListener('llm/chat/completions/done', doneHandler, { once: false });
        const removeErrorListener = bridge.addCommandListener('llm/chat/completions/error', errorHandler, { once: false });

        // --- 3. 发送启动消息 (单向) ---
        bridge.postMessage({
            command: 'llm/chat/completions',
            data: data
        });
    });
}