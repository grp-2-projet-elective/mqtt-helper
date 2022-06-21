import EventEmitter from "events";
import { ResponseMessage, RequestMessage } from "models/esb.model";

export function ResponseEvent(
    eventEmitter: EventEmitter,
    apiName: string,
    requestId: string,
    payload: Buffer
) {
    const eventName = `responseEvent/${apiName}/${requestId}`;
    const eventData: ResponseMessage = JSON.parse(payload.toString());
    return eventEmitter.emit(eventName, eventData);
}
export function RequestEvent(
    eventEmitter: EventEmitter,
    apiName: string,
    action: string,
    payload: Buffer
) {
    const eventName = `requestEvent/${apiName}/${action}`;
    const eventData: RequestMessage = JSON.parse(payload.toString());
    return eventEmitter.emit(eventName, eventData);
}