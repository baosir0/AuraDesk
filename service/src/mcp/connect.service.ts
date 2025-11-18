import { RequestClientType, RestfulResponse } from "src/common/index.dto";
import { connect, McpClient } from "./client.service";
import { PostMessageble } from "src/hook/adapter.dto";
import { McpOptions } from "./client.dto";
import { deterministicUUID, getCommandFileExt, getCWD } from "./utils";


export const clientMap: Map<string, RequestClientType> = new Map();

export function getClient(clientId: string | undefined): McpClient{
    const client = clientMap.get(clientId || '')
    return client
}

export async function connectService(options: McpOptions, webview: PostMessageble): Promise<RestfulResponse>{
    await preprocessCommand(options, webview)
    const uuid = await deterministicUUID(JSON.stringify(options))
    const reuseConnection = clientMap.has(uuid)
    
    clientMap.get(uuid)?.disconnect()
    clientMap.get(uuid)?.close()

    const client = await connect(options)
    clientMap.set(uuid, client)

    const versionInfo = client.getServerVersion();  

    const connectResult = {
            code: 200,
            msg: {
                status: 'success',
                clientId: uuid,
                reuseConnection,
                name: versionInfo?.name || 'unknown',
                version: versionInfo?.version || 'unknown'
            }
        };
    return connectResult
}

export async function disconnectService(data: any, webview: PostMessageble): Promise<RestfulResponse>{
    const connectResult = {
            code: 200,
            msg: {
                status: 'success',
                clientId: uuid,
                reuseConntion,
                name: versionInfo?.name || 'unknown',
                version: versionInfo?.version || 'unknown'
            }
        };
    return connectResult
}

async function preprocessCommand(option: McpOptions, webview?: PostMessageble) {
    // 对于特殊表示的路径，进行特殊的支持
    if (option.args) {
        option.args = option.args.map(arg => {
            if (arg.startsWith('~/')) {
                return arg.replace('~', process.env.HOME || '');
            }
            return arg;
        });
    }

    if (option.cwd && option.cwd.startsWith('~/')) {
        option.cwd = option.cwd.replace('~', process.env.HOME || '');
    }

    const cwd = getCWD(option);
    if (!cwd) {
        return;
    }

    const ext = getCommandFileExt(option);
    if (!ext) {
        return;
    }

    // STDIO 模式下，对不同类型的项目进行额外支持
    // uv：如果没有初始化，则进行 uv sync，将 mcp 设置为虚拟环境的
    // npm：如果没有初始化，则进行 npm init，将 mcp 设置为虚拟环境
    // go：如果没有初始化，则进行 go mod init

    switch (ext) {
        case '.py':
            await initUv(option, cwd, webview);
            break;
        default:
            break;
    }
}

