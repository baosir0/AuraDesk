<template>
  <div class="chat-container">
    

    <!-- 消息区域 -->
    <div class="messages-container" ref="messagesContainer">
      <!-- 消息列表 -->
      <div 
        v-for="(message, index) in messages" 
        :key="index" 
        :class="['message', message.type]"
      >
        <!-- AI 消息 -->
        <div v-if="message.type === 'ai'" class="message-content">
          <div class="avatar">AI</div>
          <div class="bubble">
            <div class="text" v-html="formatMessage(message.content)"></div>
            <div class="timestamp">{{ message.timestamp }}</div>
          </div>
        </div>

        <!-- 用户消息 -->
        <div v-else class="message-content user">
          <div class="bubble">
            <div class="text">{{ message.content }}</div>
            <div class="timestamp">{{ message.timestamp }}</div>
          </div>
          <div class="avatar">You</div>
        </div>
      </div>
    </div>
    <!-- 输入区域 -->
      <div class="input-container">
        <div class="input-wrapper">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 6 }"
            @keyup.enter="handleSend"
            placeholder="输入你的问题..."
            class="message-input"
            resize="none"
          >
            <template #append>
              <el-button 
                @click="sendMessage" 
                type="primary" 
                :icon="Promotion" 
                class="send-btn"
              />
            </template>
          </el-input>
        </div>
        <div class="input-footer">
          <span class="hint">Enter 发送，Shift + Enter 换行</span>
        </div>
      </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick} from 'vue'
import { Promotion } from '@element-plus/icons-vue'
import { useMessageStore } from '@/store/MessageStore'
import { formatMessage } from '@/utils'

// import { watch } from 'vue'

const messageStore = useMessageStore()

const inputMessage = ref('')
const messagesContainer = ref(null)
const messages = messageStore.messages

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const sendMessage = () => {
  messageStore.addMessage(inputMessage.value)
  inputMessage.value = ''
  scrollToBottom()
}

const handleSend = (event) => {
  if (event.shiftKey) {
    // Shift + Enter 换行
    return
  }
  event.preventDefault()
  sendMessage()
}

onMounted(() => {
  scrollToBottom()
  messageStore.connectToServer()
})
</script>



<style scoped>


.chat-container {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #222121 0%, #1b1b1b 100%);
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

}





.ai-avatar {
  width: 2.5rem;
  height: 2.5rem;
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
}





.icon-btn {
  width: 2.2rem;
  height: 2.2rem;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 0.3rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  transition: background 0.2s;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.close-btn:hover {
  background: #ff5f57;
}

/* 消息区域 */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: -10px;
  display: flex;
  flex-direction: column;

}

.message-content {
  display: flex;
  align-items: flex-end;
  padding: 1vh;
  max-width: 85%;
}

.message-content.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.avatar {
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 50%;
  background: linear-gradient(45deg, #4facfe, #00f2fe);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
  flex-shrink: 0;
}

.message-content.user .avatar {
  background: linear-gradient(45deg, #ff9a9e, #fad0c4);
}

.bubble {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 1.2rem;
  padding: 0.8rem 1.2rem;
  box-shadow: 0 0.2rem 0.8rem rgba(0, 0, 0, 0.1);
  max-width: 100%;
  word-wrap: break-word;
}

.message-content.user .bubble {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.text {
  line-height: 1.5;
  font-size: 0.95rem;
}

.timestamp {
  font-size: 0.75rem;
  opacity: 0.7;
  margin-top: 0.3rem;
  text-align: right;
}

.message-content.user .timestamp {
  text-align: left;
}

/* 输入区域 */
.input-container {
  margin-top: auto;
  margin-left: 2vw ;
  margin-right: 2vw;
  padding: 1.5vh 0 0;
}

.input-wrapper {
  background: transparent;
  backdrop-filter: blur(10px);
  border-radius: 0.8rem;

  box-shadow: 0 0.3rem 1.5rem rgba(207, 203, 203, 0.795);
}

:deep(.message-input .el-textarea__inner) {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  font-size: 0.95rem;
  line-height: 1.5;
  padding: 0.8rem 1.2rem;
  resize: none;
}

:deep(.message-input .el-input-group__append) {
  background: transparent !important;
  border: none !important;
  padding: 0 0.8rem !important;
}

.send-btn {
  background: linear-gradient(135deg, #667eea, #764ba2) !important;
  border: none !important;
  color: white !important;
  border-radius: 0.6rem !important;
  padding: 0.7rem !important;
  transition: all 0.2s ease !important;
}

.send-btn:hover {
  transform: translateY(-0.1rem);
  box-shadow: 0 0.3rem 1rem rgba(102, 126, 234, 0.4);
}

.input-footer {
  text-align: center;
  margin-top: 0.6vh;
}

.hint {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
}

/* 滚动条样式 */
.messages-container::-webkit-scrollbar {
  width: 0.4rem;
}

.messages-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.2rem;
}

.messages-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 0.2rem;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* 响应式设计 - 移动端适配 */
@media (max-width: 768px) {
  .chat-header {
    height: 8vh;
    padding: 0 3vw;
  }
  
  .messages-container {
    padding: 2vh 3vw;
    gap: 2vh;
  }
  
  .message-content {
    max-width: 95%;
    gap: 2vw;
  }
  
  .avatar {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 0.7rem;
  }
  
  .bubble {
    border-radius: 1rem;
    padding: 0.6rem 1rem;
  }
  
  .text {
    font-size: 0.9rem;
  }
  
  .input-wrapper {
    border-radius: 0.6rem;
  }
}

/* 超大屏幕适配 */
@media (min-width: 1920px) {
  .chat-header {
    height: 5vh;
  }
  
  .messages-container {
    padding: 2vh 10vw;
  }
  
  .message-content {
    max-width: 70%;
  }
  
  .avatar {
    width: 3.5rem;
    height: 3.5rem;
    font-size: 1rem;
  }
  
  .bubble {
    border-radius: 1.5rem;
    padding: 1rem 1.5rem;
  }
  
  .text {
    font-size: 1.1rem;
  }
}

/* 防止内容过小 */
@media (max-height: 500px) {
  .chat-header {
    min-height: 2.5rem;
  }
  
  .avatar {
    min-width: 2rem;
    min-height: 2rem;
  }
  
  .bubble {
    padding: 0.5rem 0.8rem;
  }
}
</style>