
import { McpOptions } from "@/service/client.dto";
import { getToolList, llmChat } from "@/service/clientservice";
import { connectToServer } from "@/service/connectService";
import { getCurrentTime } from "@/utils";
import { defineStore } from "pinia";

export interface Message {
    type: string;
    content: string;
    timestamp: string
}

export interface Tools {

}

export interface MessagesState {
    messages: Message[]; 
    tools: Tools 
    clientId: string
    temp: number
    isConnected: boolean
    options: McpOptions
}

export const useMessageStore = defineStore('messageStore',{
    state: (): MessagesState => ({
        messages: [],
        tools: [],
        clientId: '',
        isConnected: false,
        temp: 0,
        options: {
            command: 'mcp',
            args: ['run', `${process.env.VUE_APP_SERVER_PATH}`]
        }
    }),

    getters:{},
    
    actions: {
        async addMessage(content: string) {
            const currentTime = getCurrentTime()
            const newMessage:Message = {
                type: 'user',
                content: content,
                timestamp: currentTime
            }
            this.messages.push(newMessage) 
            const requestData = {
                sessionId: Date.now().toString(),
                baseURL: process.env.VUE_APP_BASE_URL, 
                apiKey: process.env.VUE_APP_ANTHROPIC_API_KEY, 
                model: process.env.VUE_APP_LLM_MODEL,
                messages: [{ role: 'user', content: content }]
            };
            this.messages.push({
                type: 'ai',
                content: '',
                timestamp: currentTime
            })

            const lastIndex = this.messages.length - 1;

            try {
                await llmChat(
                    requestData,
                    (chunk) => {
                        if (chunk.choices[0].delta.content) {
                            this.messages[lastIndex].content += chunk.choices[0].delta.content;
                        }
                    },
                    (error) => {
                        console.error('Streaming Chat Error:', error);
                        this.messages[-1].content += '\n[ERROR OCCURRED]';
                    }
                );
                console.log("Chat stream fully finished and resolved.");
            } catch (e) {
                console.error("Chat flow was rejected or aborted:", e);
            }
        },

        async getToolList(clientId: string) {
            try{
                this.tools = await getToolList(clientId)
            }catch(error) {
                console.log('获取工具列表失败')
            }
        },

        async connectToServer() {
            try{
                const res = await connectToServer(this.options)
                if(res.code == 200) {
                    this.isConnected = true
                    this.clientId = res.msg.clientId
                    this.temp = 0
                }
            }catch(error) {
                if(this.temp < 5){
                    console.log('服务器连接失败,正在重试')
                    setTimeout(()=>{},1000)
                    this.temp += 1
                    await this.connectToServer()
                }else{
                    console.log('已达最大重试次数，服务器连接失败')
                }
                
            }
        }
    }
})