import { Module } from '@nestjs/common';
import { RabbitmqService } from './rabbitmq.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RebbitMqOptions, MqttOptions } from 'rabbitmq.config';
import { RabbitmqController } from './rabbitmq.controller';

@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'RABBITMQ_SERVICE',
                transport: Transport.RMQ,
                options: RebbitMqOptions.options,
            },
        ]),
        ClientsModule.register([
            {
                name: 'MQTT_SERVICE',
                transport: Transport.MQTT,
                options: MqttOptions.options, // Provide your MQTT configuration here
            },
        ]),
    ],
    providers: [RabbitmqService],
    exports: [RabbitmqService],
    controllers: [RabbitmqController],
})
export class RabbitmqModule {}
