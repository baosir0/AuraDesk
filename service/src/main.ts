import { WebSocketServer} from 'ws';
import { browserAdapter } from './hook/browserAdapter';
import { WebSocketMessage } from './hook/adapter.dto';
import { routeMessage } from './common/route';
import './llm/llm.controller'
const wss = new WebSocketServer({port:1234})
console.log("Mcp服务已启动")
wss.on('connection', (ws) => {
    const webview = new browserAdapter(ws);

    webview.postMessage({
        command: 'hello',
        data: {
            version: '0.0.1',
            name: '消息桥连接完成'
        }
    });

    webview.onMessage(async (message: WebSocketMessage) =>{
        const {command, data} = message
        switch(command){
            case '':
                break
            default:
                routeMessage(command, data, webview)
        }
    })
});