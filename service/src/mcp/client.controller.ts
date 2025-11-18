import { Controller } from "../common/index";
import { RequestData, RestfulResponse } from "../common/index.dto";
import { MessageClient, PostMessageble } from "../hook/adapter.dto";
import { postProcessMcpToolcallResponse } from "./client.service";
import { getClient } from "./connect.service";

export class ClientController{
    @Controller('server/version')
    async getServerVersion(data:RequestData, webview: PostMessageble){
        const client = getClient(data.clientId)
        if (!client){
            return {
                code: 501,
                msg: "客户端未连接"
            }
        }
        const version = client.getServerVersion()
        return {
            code: 200,
            msg: version
        }
    }

    @Controller('tools/call')
    async calltool(data: RequestData, webview: PostMessageble){
        const client = getClient(data.clientId);
        if (!client) {
            return {
                code: 501,
                msg: 'mcp client 尚未连接'
            };
        }
        const toolResult = await client.callTool({
            name: data.toolName,
            arguments: data.toolArgs,
            callToolOption: data.callToolOption
        });

        // postProcessMcpToolcallResponse(toolResult, webview);

        return {
            code: 200,
            msg: toolResult
        };
    }



}