import { PostMessageble } from "src/hook/adapter.dto";
import { McpOptions, ToolCallResponse } from "./client.dto";
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";


export class McpClient {
    private client: Client
    private transport: StdioClientTransport | null = null
    private options: McpOptions

    constructor(options: McpOptions) {
        this.options = options
        this.client = new Client(
            {
                name: "openmcp test local client",
                version: "0.0.1"
            }
        );

    }

    async connect() {
    /**
     * Connect to an MCP server
     *
     * @param serverScriptPath - Path to the server script (.py or .js)
     */
        try {
            this.transport = new StdioClientTransport({
                command: this.options.command || '',
                args: this.options.args
            });

            await this.client.connect(this.transport);
        } catch (e) {
            console.log("Failed to connect to MCP server: ", e);
            throw e;
        }
    }

    getServerVersion() {

    }

    // 列出所有工具
    async listTools() {
        return await this.client.listTools();
    }

    public async callTool(options: { name: string; arguments: Record<string, any>, callToolOption?: any }) {
        const { callToolOption, ...methodArgs } = options;
        const res = await this.client.callTool(methodArgs, undefined, callToolOption);
        return res;
    }

    disconnect() {

    }

    close() {

    }
}

export function postProcessMcpToolcallResponse(
    response: ToolCallResponse,
    webview: PostMessageble
): ToolCallResponse {
    if (response.isError) {
        // 如果是错误响应，将其转换为错误信息
        return response;
    }

    // 将 content 中的图像 base64 提取出来，并保存到本地
    // for (const content of response.content || []) {
    //     switch (content.type) {
    //         case 'image':
    //             handleImage(content, webview);
    //             break;

    //         default:
    //             break;
    //     }
    // }

    return response;
}

export async function connect(options: McpOptions): Promise<McpClient> {
    const client = new McpClient(options);
    await client.connect();
    return client;
}