
import EventEmitter from 'events';
import { IErrorCallback, ResponseMessage } from 'models/esb.model';
import { IClientPublishOptions, IClientSubscribeOptions, MqttClient } from 'mqtt';
import { publishWithResponse, publishWithResponseBasic } from 'utils/mqtt-async.helper';
import { RequestEvent, ResponseEvent } from 'utils/relay-response-event.helper';

export class EsbService {
    private _isMqttClientConnected: boolean = false;
    public get isMqttClientConnected(): boolean {
        return this._isMqttClientConnected;
    }
    public readonly eventEmitter: EventEmitter = new EventEmitter();

    constructor(public readonly mqttClient: MqttClient, public readonly topics: Array<string>) {
        this.initEsbService();
    }

    private initEsbService(): void {
        this.mqttClient.on('connect', () => {
            this._isMqttClientConnected = true;
            console.log(`Connected to mqtt ${new Date()}`);

            const opts: IClientSubscribeOptions = {
                qos: 1,
            };

            this.mqttClient.subscribe('request/+/+', opts, (err: Error) => {
                if (!err) {
                    console.log('ESB request topics subscribed');
                    return;
                }

                console.error(err);
            });

            this.mqttClient.subscribe(['response/+/+'], (err: Error) => {
                if (!err) {
                    console.log('ESB response topics subscribed');
                    return;
                }

                console.error(err);
            });

            this.mqttClient.subscribe('otherTopics/#', opts, (err: Error) => {
                if (!err) {
                    console.log('ESB other topics subscribed');
                    return;
                }

                console.error(err);
            });

            this.initEsbMessagesListening();
        });

        this.mqttClient.on('error', (err: IErrorCallback) => {
            console.error('Error: ' + err);

            if (err.code == 'ENOTFOUND') {
                console.error('Network error, make sure you have an active internet connection');
            }
        });

        this.mqttClient.on('close', () => {
            this._isMqttClientConnected = false;
            console.log('Connection closed by client');
        });

        this.mqttClient.on('reconnect', () => {
            console.log('Client trying a reconnection');
        });

        this.mqttClient.on('offline', () => {
            this._isMqttClientConnected = false;
            console.log('Client is currently offline');
        });
    }

    private initEsbMessagesListening(): void {
        this.mqttClient.on('message', (topic, payload, packet) => {
            const topicArr = topic.split('/'); //spliting the topic ==> [response,apiName,action]
            switch (topicArr[0]) {
                case 'response':
                    console.log(topic.toString())
                    console.log(payload.toString())
                    console.log(packet)
                    return ResponseEvent(this.eventEmitter, topicArr[1], topicArr[2], payload);
                case 'request':
                    if (
                        packet.properties &&
                        packet.properties.responseTopic &&
                        packet.properties.correlationData &&
                        packet.properties.correlationData.toString() === "secret"
                    ) {
                        console.log(packet)
                        console.log(packet.properties.correlationData.toString())
                        const responseData = {
                            error: false,
                            message: payload.toString(),
                        };
                        this.mqttClient.publish(
                            packet.properties.responseTopic,
                            JSON.stringify(responseData)
                        );
                        return RequestEvent(this.eventEmitter, topicArr[1], topicArr[2], payload);
                    }
                case 'otherTopics':
                    console.log('other topics');
                    console.log(topic.toString())
                    console.log(payload.toString())
                    console.log(packet)
                    return;
                default:
                    return console.log('can not find anything');
            }
        });
    }

    public async call(
        apiName: string,
        action: string,
        payload: string,
    ): Promise<ResponseMessage> {
        try {
            const responseTopic = `response/${apiName}/${action}`;
            const requestTopic = `request/${apiName}/${action}`;
            const publishOptions: IClientPublishOptions = {
                qos: 1,
                properties: {
                    responseTopic,
                    correlationData: Buffer.from('secret', 'utf-8'),
                },
            };

            const responseMessage = JSON.parse(await publishWithResponseBasic(this.mqttClient, payload, publishOptions, requestTopic, responseTopic).toString());
            console.log(`${apiName}/${action} : ${JSON.stringify(responseMessage)}`);
            return responseMessage;
        } catch (error) {
            throw new Error(`${apiName}/${action} : ${error}`);
        }
    };
}