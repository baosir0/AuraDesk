import { McpOptions } from "./client.dto";
import path from 'node:path';
import fs from 'node:fs';
import { PostMessageble } from "src/hook/adapter.dto";

export function getCWD(option: McpOptions) {
    // if (option.cwd) {
    // 	return option.cwd;
    // }
    const file = option.args?.at(-1);
    if (file) {
        // 如果是绝对路径，直接返回目录
        if (path.isAbsolute(file)) {
            // 如果是是文件，则返回文件所在的目录
            if (!fs.existsSync(file)) {
                return '';
            }

            if (fs.statSync(file).isDirectory()) {
                return file;
            } else {
                return path.dirname(file);
            }
        } else {
            // 如果是相对路径，根据 cwd 获取真实路径
            const absPath = path.resolve(option.cwd || process.cwd(), file);

            if (!fs.existsSync(absPath)) {
                return '';
            }

            // 如果是是文件，则返回文件所在的目录
            if (fs.statSync(absPath).isDirectory()) {
                return absPath;
            } else {
                return path.dirname(absPath);
            }
        }
    }
    return undefined;
}

export function getCommandFileExt(option: McpOptions) {
    const file = option.args?.at(-1);
    if (file) {
        return path.extname(file);
    }
    return undefined;
}

// async function initUv(option: McpOptions, cwd: string, webview?: PostMessageble) {
//     let projectDir = cwd;

//     while (projectDir !== path.dirname(projectDir)) {
//         if (fs.readdirSync(projectDir).includes('pyproject.toml')) {
//             break;
//         }
//         projectDir = path.dirname(projectDir);
//     }

//     const venv = path.join(projectDir, '.venv');

//     // judge by OS
//     const mcpCli = os.platform() === 'win32' ?
//         path.join(venv, 'Scripts', 'mcp.exe') :
//         path.join(venv, 'bin', 'mcp');

//     if (option.command === 'mcp') {
//         option.command = mcpCli;
//         // option.cwd = projectDir;
//     }

//     if (fs.existsSync(mcpCli)) {
//         return '';
//     }

//     const syncOutput = await collectAllOutputExec('uv sync', projectDir);

//     webview?.postMessage({
//         command: 'connect/log',
//         data: {
//             code: syncOutput.toLowerCase().startsWith('error') ? 501 : 200,
//             msg: {
//                 title: 'uv sync',
//                 message: syncOutput
//             }
//         }
//     });

//     const addOutput = await collectAllOutputExec('uv add mcp "mcp[cli]"', projectDir);
//     webview?.postMessage({
//         command: 'connect/log',
//         data: {
//             code: addOutput.toLowerCase().startsWith('error') ? 501 : 200,
//             msg: {
//                 title: 'uv add mcp "mcp[cli]"',
//                 message: addOutput
//             }
//         }
//     });
// }


export async function deterministicUUID(input: string) {
    // 使用Web Crypto API进行哈希
    const msgBuffer = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 格式化为UUID (版本5)
    return [
        hashHex.substring(0, 8),
        hashHex.substring(8, 4),
        '5' + hashHex.substring(13, 3), // 设置版本为5
        '8' + hashHex.substring(17, 3), // 设置变体
        hashHex.substring(20, 12)
    ].join('-');
}