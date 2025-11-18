import { MCPClient } from '../src/mcp/client.service';
import { McpOptions } from '../src/mcp/client.dto';
const options: McpOptions = {command: "mcp", args: ["run", "C:\\persional_system\\project\\my-aiagent\\service\\src\\mcp1\\server.py"]}
const client = new MCPClient(options)
async function main() {
    await client.connect()
    const mes = await client.listTools()
    console.log(mes)
} 
main()