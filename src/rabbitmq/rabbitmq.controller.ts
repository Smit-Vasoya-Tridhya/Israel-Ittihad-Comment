import { Body, Controller, Inject, Post } from '@nestjs/common';
import { RabbitmqService } from './rabbitmq.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('rabbitmq')
export class RabbitmqController {
    constructor(private readonly mqttService: RabbitmqService) {}

    @MessagePattern('user-typing')
    async userTyping(@Payload() data: { userId: string }) {
        this.mqttService.publish('user-typing', JSON.stringify(data));
    }
}
