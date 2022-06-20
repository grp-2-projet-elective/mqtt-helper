import EventEmitter from "events";
import { ResponseMessage } from "models/esb.model";

export function ResponseEvent(
    eventEmitter: EventEmitter,
    apiName: string,
    action: string,
    payload: Buffer
) {
    const eventName = `responseEvent/${apiName}/${action}`;
    const eventData: ResponseMessage = JSON.parse(payload.toString());
    return eventEmitter.emit(eventName, eventData);
}