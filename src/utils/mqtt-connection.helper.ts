import { connect, IClientOptions, MqttClient } from "mqtt";

export function initMqttClient(url: string, mqttClientOptions: IClientOptions): MqttClient {
    const mqttClient: MqttClient = connect(url, mqttClientOptions);
    return mqttClient;
}