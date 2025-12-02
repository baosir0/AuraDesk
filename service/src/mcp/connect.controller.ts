import { connectService, disconnectService } from "./connect.service";
import { Controller } from '../common/index';
import { PostMessageble } from '../hook/adapter.dto';
import { RequestData, RestfulResponse } from '../common/index.dto';

export class  ConnectController {
    @Controller('connect')
    async connect(data: any, webview: PostMessageble): Promise<RestfulResponse>{
        const res = connectService(data, webview)
        return res
    }

    @Controller('disconnect')
    async disconnect(data: RequestData, webview: PostMessageble): Promise<RestfulResponse>{
        const res = disconnectService(data, webview)
        return res
    }
}