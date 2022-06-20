import { mqttClientOptions } from "models/esb.model";
import { connect, MqttClient } from "mqtt";

export const mqttClient: MqttClient = connect('mqtt://localhost:1883', mqttClientOptions);