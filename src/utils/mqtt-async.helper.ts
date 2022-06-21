import EventEmitter from "events";
import { RequestMessage, ResponseMessage } from "models/esb.model";
import { IClientPublishOptions, MqttClient } from "mqtt";

// function publishWithResponseBasic(
//     client: MqttClient,
//     message: string,
//     publishOptions: IClientPublishOptions,
//     requestTopic: string,
//     responseTopic: string
// ): Promise<string> {
//     return new Promise((resolve, reject) => {
//         const requestMessage: RequestMessage = {
//             payload: message,
//         };
//         client.subscribe(responseTopic);
//         client.once("message", (topic, payload) => {
//             client.unsubscribe(responseTopic);
//             try {
//                 const responseMessage: ResponseMessage = JSON.parse(
//                     payload.toString()
//                 );
//                 responseMessage.error
//                     ? reject(responseMessage.payload)
//                     : resolve(responseMessage.payload);
//             } catch (error) {
//                 resolve("JsonConvertError");
//             }
//         });
//         client.publish(
//             requestTopic,
//             JSON.stringify(requestMessage),
//             publishOptions
//         );
//     });
// }

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
