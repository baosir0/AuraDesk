import { PostMessageble } from "../hook/adapter.dto";
import { McpClient } from "../mcp/client.service";

export type RequestClientType = McpClient | undefined;

export interface RequestData {
    clientId?: string;
    [key: string]: any;
}

export type RequestHandler<T, R> = (
    data: T & RequestData,
    webview: PostMessageble
) => Promise<R>;

export interface RequestHandlerStore<T, R> {
    handler: RequestHandler<T, R>
    option?: ControllerOption;
}

export interface MapperDescriptor<T> {
    configurable?: boolean;
    enumerable?: boolean;
    value?: RequestHandler<T, RestfulResponse>;
    writable?: boolean;
    get?(): any;
    set?(v: any): void;
}

export interface RestfulResponse {
    code: number;
    msg: any;
}

export interface ControllerOption {
    [key: string]: any;
}