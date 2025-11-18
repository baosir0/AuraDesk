import OpenAI from "openai";
import { RequestData } from "src/common/index.dto";
import { PostMessageble } from "src/hook/adapter.dto";

export const chatStreams = new Map<string, AsyncIterable<any>>();

export async function streamingChatCompletion(data: RequestData, webview: PostMessageble) {
    const {
        sessionId,
        baseURL,
        apiKey,
        model,
        messages,
        temperature,
        tools = [],
        parallelToolCalls = true,
        proxyServer = ''
    } = data;

    const client = new OpenAI({
        baseURL,
        apiKey
    })

    const seriableTools = (tools.length === 0) ? undefined : tools;
    const seriableParallelToolCalls = (tools.length === 0) ?
        undefined : model.startsWith('gemini') ? undefined : parallelToolCalls;
        
    const stream = await client.chat.completions.create({
        model,
        messages,
        temperature,
        tools: seriableTools,
        parallel_tool_calls: seriableParallelToolCalls,
        stream: true
    });

    // 用 sessionId 作为 key 存储流
    if (sessionId) {
        chatStreams.set(sessionId, stream);
    }

    // 流式传输结果
    for await (const chunk of stream) {        
        if (!chatStreams.has(sessionId)) {            
            // 如果流被中止，则停止循环
            stream.controller.abort();
            webview.postMessage({
                command: 'llm/chat/completions/done',
                data: {
                    sessionId,
                    code: 200,
                    msg: {
                        success: true,
                        stage: 'abort'
                    }
                }
            });
            break;
        }

        if (chunk.choices) {
            webview.postMessage({
                command: 'llm/chat/completions/chunk',
                data: {
                    sessionId,
                    code: 200,
                    msg: {
                        chunk
                    }
                }
            });
        }
    }

    // console.log('sessionId finish ' + sessionId);

    // 传输结束，移除对应的 stream
    if (sessionId) {
        chatStreams.delete(sessionId);
    }
    webview.postMessage({
        command: 'llm/chat/completions/done',
        data: {
            sessionId,
            code: 200,
            msg: {
                success: true,
                stage: 'done'
            }
        }
    });
}