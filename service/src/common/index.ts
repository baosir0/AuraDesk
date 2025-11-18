import { MapperDescriptor, RestfulResponse, ControllerOption, RequestHandlerStore } from "./index.dto";

export const requestHandlerStorage = new Map<string, RequestHandlerStore<any, RestfulResponse>>();

export function Controller(command: string, option: ControllerOption = {}) {
    console.log("ch")
    return function<T>(target: any, propertykey: string, descriptor: MapperDescriptor<T>) {
        const handler = descriptor.value;
        if (requestHandlerStorage.has(command)) {
            throw new Error(`Duplicate request handler for ${command}`);
        }
        if (handler) {
            requestHandlerStorage.set(command, { handler, option });
        }
        return descriptor;
    }
}