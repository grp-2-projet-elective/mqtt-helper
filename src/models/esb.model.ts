export interface ResponseMessage {
    error: boolean;
    payload: string;
}

export interface RequestMessage {
    requestId: string;
    payload: string;
}

export interface IErrorCallback {
    code: string;
    [key: string]: any;
}