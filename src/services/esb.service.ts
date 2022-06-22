
import EventEmitter from 'events';
import { IErrorCallback, RequestMessage, ResponseMessage } from 'models/esb.model';
import { IClientPublishOptions, IClientSubscribeOptions, MqttClient } from 'mqtt';
import { publishWithResponse, publishWithResponseAsync } from 'utils/mqtt-async.helper';
import { RequestEvent, ResponseEvent } from 'utils/relay-response-event.helper';

export class EsbService {
    private _isMqttClientConnected: boolean = false;
    public get isMqttClientConnected(): boolean {
        return this._isMqttClientConnected;
    }
    public readonly eventEmitter: EventEmitter = new EventEmitter();

    constructor(public readonly mqttClient: MqttClient, public apiName: string, public readonly unlistenedTopics: Array<string>) {
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

            this.mqttClient.subscribe('response/+/+', (err: Error) => {
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
                    if (!this.unlistenedTopics.includes(topicArr[1])) {
                        console.log(topic)
                        console.log(JSON.parse(payload.toString()))
                        return ResponseEvent(this.eventEmitter, topicArr[1], JSON.parse(payload.toString()).requestId, payload);
                    }
                case 'request':
                    if (topicArr[1] === this.apiName) {
                        console.log(topic)
                        console.log(JSON.parse(payload.toString()))

                        return RequestEvent(this.eventEmitter, topicArr[1], topicArr[2], payload);
                    }
                case 'otherTopics':
                    console.log('other topics');
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
            const responseTopic = `response/${apiName}/${JSON.parse(payload).requestId}`;
            const requestTopic = `request/${apiName}/${action}`;
            const publishOptions: IClientPublishOptions = {
                qos: 1,
                properties: {
                    responseTopic,
                    correlationData: Buffer.from('secret', 'utf-8'),
                },
            };

            const responseMessage = await publishWithResponse(this.mqttClient, payload, publishOptions, requestTopic, responseTopic, this.eventEmitter);
            console.log(`${apiName}/${action} : ${JSON.stringify(responseMessage.toString())}`);
            return responseMessage;
        } catch (error) {
            throw new Error(`${apiName}/${action} : ${error}`);
        }
    };

    public async callAsync(
        apiName: string,
        action: string,
        message: RequestMessage,
    ): Promise<ResponseMessage> {
        try {
            const responseTopic = `response/${apiName}/${message.requestId}`;
            const requestTopic = `request/${apiName}/${action}`;

            const responseMessage = await publishWithResponseAsync(this.mqttClient, message, requestTopic, responseTopic);
            console.log(`${apiName}/${action} : ${JSON.stringify(responseMessage.toString())}`);
            return responseMessage;
        } catch (error) {
            throw new Error(`${apiName}/${action} : ${error}`);
        }
    };
}