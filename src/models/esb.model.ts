import { IClientOptions } from "mqtt";

export const mqttClientOptions: IClientOptions = {
    port: 1883,
    protocolVersion: 5,
    keepalive: 60,
    properties: {
        requestResponseInformation: true,
        requestProblemInformation: true,
    },
};

export interface ResponseMessage {
    error: boolean;
    payload: string;
}

export interface RequestMessage {
    payload: string
}

export interface IErrorCallback {
    code: string;
    [key: string]: any;
}