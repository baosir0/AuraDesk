import { Controller } from "src/common";
import { RequestData } from "src/common/index.dto";
import { PostMessageble } from "src/hook/adapter.dto";
import { streamingChatCompletion } from "./llm.service";

export class LlmController {

    @Controller('llm/chat/completions')
    async chatCompletion(data: RequestData, webview: PostMessageble) {

        try {
            await streamingChatCompletion(data, webview);
        } catch (error) {            
            webview.postMessage({
                command: 'llm/chat/completions/error',
                data: {
                    sessionId: data.sessionId,
                    code: 500,
                    msg: error
                }
            });
        }


        return {
            code: -1,
            msg: 'terminate'
        };
    } 
}