import EventEmitter from "events";
import { ResponseMessage } from "models/esb.model";
import { IClientPublishOptions, MqttClient } from "mqtt";

async function publishWithResponse(
    client: MqttClient,
    data: string,
    publishOptions: IClientPublishOptions,
    responseEventName: string,
    requestTopic: string,
    eventEmitter: EventEmitter,
): Promise<ResponseMessage> {
    return new Promise((resolve, reject) => {
        const checkTimeOut = setTimeout(() => {
            const responseMessage: ResponseMessage = {
                error: true,
                payload: "timeOut",
            };

            eventEmitter.emit(responseEventName, responseMessage);
        }, 5000);
        eventEmitter.once(
            responseEventName,
            (responseMessage: ResponseMessage) => {
                clearTimeout(checkTimeOut);
                responseMessage.error
                    ? reject(responseMessage.payload)
                    : resolve(responseMessage);
            }
        );

        const payload = { data };
        client.publish(requestTopic, JSON.stringify(payload), publishOptions);
    });
}
// publishWithResponseBasic, 
export { publishWithResponse };

