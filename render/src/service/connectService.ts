import { useMessageBridge } from "@/api/message-bridge";
import { McpOptions } from "./client.dto";

export function connectToServer(options: McpOptions) {
    const bridge = useMessageBridge()
    const requestData = options
    return bridge.commandRequest('connect', requestData)
}