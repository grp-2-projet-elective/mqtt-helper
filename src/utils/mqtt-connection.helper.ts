import { connect, IClientOptions, MqttClient } from "mqtt";

export function initMqttClient(mqttClientOptions: IClientOptions): MqttClient {
    const mqttClient: MqttClient = connect('mqtt://localhost:1883', mqttClientOptions);
    return mqttClient;
}