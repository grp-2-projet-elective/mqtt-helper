export interface ResponseMessage {
    error: boolean;
    payload: string;
}

export interface RequestMessage {
    payload: string;
}

export interface IErrorCallback {
    code: string;
    [key: string]: any;
}