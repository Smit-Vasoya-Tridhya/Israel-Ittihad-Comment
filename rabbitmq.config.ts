import { Transport } from '@nestjs/microservices';
import * as dotenv from 'dotenv';
dotenv.config();

export const RebbitMqOptions = {
    transport: 'RMQ',
    options: {
        urls: [process.env.RABBITMQ_URL], // RabbitMQ server URL

        queueOptions: {
            durable: true,
        },
    },
};

export const MqttOptions = {
    transport: Transport.MQTT,
    options: {
        url: process.env.MQTT_URL, // Replace with your MQTT broker URL
        client: {
            id: process.env.MQTT_Client_ID, // Replace with a unique client ID
        },
    },
};
