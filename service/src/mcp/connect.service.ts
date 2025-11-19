import { RequestClientType, RestfulResponse } from "src/common/index.dto";
import { connect, McpClient } from "./client.service";
import { PostMessageble } from "src/hook/adapter.dto";
import { McpOptions } from "./client.dto";
import { deterministicUUID, getCommandFileExt, getCWD } from "./utils";


export const clientMap: Map<string, RequestClientType> = new Map();

export function getClient(clientId: string | undefined): RequestClientType{
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
    const {clientId} = data
    if (!clientId) {
        return {
            code: 500,
            msg: '需要clientId'
        }
    }

    const client = clientMap.get(clientId)
    if (!client) {
        return {
            code: 500,
            msg: 'client未连接'
        }
    }

    try{
        client.disconnect()
        clientMap.delete(clientId)
        return {
            code: 200,
            msg: '关闭连接成功'
        }
    }catch(error) {
        return {
            code: 500,
            msg: '关闭连接失败'
        }
    }
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

    // if (option.cwd && option.cwd.startsWith('~/')) {
    //     option.cwd = option.cwd.replace('~', process.env.HOME || '');
    // }

    // const cwd = getCWD(option);
    // if (!cwd) {
    //     return;
    // }

    // const ext = getCommandFileExt(option);
    // if (!ext) {
    //     return;
    // }
    // switch (ext) {
    //     case '.py':
    //         await initUv(option, cwd, webview);
    //         break;
    //     default:
    //         break;
    // }
}

