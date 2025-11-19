import { getCurrentTime } from "@/utils";
import { defineStore } from "pinia";

export interface Message {
    type: string;
    content: string;
    timestamp: string
}


export interface MessagesState {
    messages: Message[]; 
}

export const useMessageStore = defineStore('messageStore',{
    state: (): MessagesState => ({
        messages: []
    }),

    getters:{},
    
    actions: {
        addMessage(content: string) {
            const currentTime = getCurrentTime()
            const newMessage:Message = {
                type: 'user',
                content: content,
                timestamp: currentTime
            }
            this.messages.push(newMessage)
        }


    }
})