import { Controller } from "src/common";
import { PostMessageble } from "src/hook/adapter.dto";
import { connectService, disconnectService } from "./connect.service";
import { RequestData, RestfulResponse } from "src/common/index.dto";

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