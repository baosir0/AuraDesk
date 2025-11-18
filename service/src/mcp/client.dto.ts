export interface ToolCallResponse {
    isError: Boolean
}

export interface McpOptions {
    // STDIO 特定选项
    command?: string;
    args?: string[];
    cwd?: string;
}