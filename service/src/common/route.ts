import { PostMessageble } from "../hook/adapter.dto";
import { requestHandlerStorage } from './index';

export async function routeMessage(command: string, data: any, webview: PostMessageble) {
    const handlerstore = requestHandlerStorage.get(command)
    if(handlerstore){
        const {handler, option = {}} = handlerstore
        try{
            const res = await handler(data, webview)
        }catch (error){
            return
        }
    }
    return
}