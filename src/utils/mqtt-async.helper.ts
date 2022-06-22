import EventEmitter from "events";
import { RequestMessage, ResponseMessage } from "models/esb.model";
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

async function publishWithResponseAsync(
    mqttClient: MqttClient,
    message: RequestMessage,
    requestTopic: string,
    responseTopic: string
): Promise<ResponseMessage> {
    return new Promise((resolve, reject) => {
        const checkTimeOut = setTimeout(() => {
            const responseMessage: ResponseMessage = {
                error: true,
                payload: "timeOut",
            };

            mqttClient.publish(responseTopic, JSON.stringify(responseMessage));
        }, 5000);

        console.log(responseTopic);
        mqttClient.once(
            responseTopic,
            (responseMessage: ResponseMessage) => {
                clearTimeout(checkTimeOut);
                console.log(JSON.parse(responseMessage.toString()));
                responseMessage.error
                    ? reject(responseMessage.payload)
                    : resolve(responseMessage);
            }
        );

        mqttClient.publish(requestTopic, JSON.stringify(message));
    });
}

// publishWithResponseBasic, 
export { publishWithResponseAsync, publishWithResponse };

