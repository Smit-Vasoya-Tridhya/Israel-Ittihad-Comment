import { Inject, Injectable, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import * as mqtt from 'mqtt';

@Injectable()
export class RabbitmqService {
    private client: mqtt.MqttClient;
    private connection: amqp.Connection;
    private channel: amqp.Channel;
    private readonly logger = new Logger(RabbitmqService.name);

    constructor() {
        this.client = mqtt.connect(process.env.MQTT_URL);
        this.client.on('connect', () => {
            console.log('Connected to MQTT broker');
        });

        this.client.on('message', (topic, message) => {
            console.log(`${message.toString()}`);
        });
    }

    publish(topic: string, message: string) {
        this.client.publish(topic, message);
    }

    subscribe(topic: string) {
        this.client.subscribe(topic);
    }

    async connect() {
        this.connection = await amqp.connect(process.env.RABBITMQ_URL); // Replace with your RabbitMQ server URL
        this.channel = await this.connection.createChannel();
    }

    async sendMessage(queue: string, message: any) {
        this.logger.log(`Sending message to ${queue}`);
        this.channel.assertQueue(queue, { durable: true });
        this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
    }

    async receiveMessage(queue: string, callback: (message: any, channel: any) => void) {
        this.logger.log(`Listening for messages on ${queue}`);
        this.channel.assertQueue(queue, { durable: true });
        this.channel.consume(queue, (message) => {
            if (message !== null) {
                const content = message.content.toString();
                this.logger.log(`Received message from ${queue}`);
                try {
                    callback(content, this.channel);
                    this.channel.ack(message);
                } catch (error) {
                    console.log('Error in callback:', error);
                }
            }
        });
    }

    async close() {
        await this.channel.close();
        await this.connection.close();
    }
}
