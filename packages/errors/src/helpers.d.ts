export declare const addCustomErrorDeserializer: (name: string, deserializer: (obj: any) => any) => void;
declare type CustomErrorFunc = (message?: string, fields?: {
    [key: string]: any;
}) => void;
export declare const createCustomErrorClass: (name: string) => CustomErrorFunc;
export declare const deserializeError: (object: any) => Error;
export declare const serializeError: (value: any) => undefined | To | string;
interface To {
    name?: string;
    message?: string;
    stack?: string;
}
export {};
//# sourceMappingURL=helpers.d.ts.map