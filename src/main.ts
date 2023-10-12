import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { HttpExceptionFilter } from './global.error.middleware';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from 'swagger.config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { MqttOptions } from 'rabbitmq.config';
import { readFileSync } from 'fs';

dotenv.config();

async function bootstrap() {
    const httpsOptions = {
        key: readFileSync('./secrets/key.pem'), // Path to your private key
        cert: readFileSync('./secrets/cert.pem'), // Pah to your certificte
    };

    let app = await NestFactory.create<NestExpressApplication>(AppModule);

    setupSwagger(app);
    app.enableCors();
    app.useStaticAssets(join(__dirname, '..', 'public'));
    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.MQTT,
        options: MqttOptions.options,
    });

    await app.startAllMicroservices();

    await app.listen(3000, () => {
        console.log(`Server started at port ${process.env.PORT}`);
    });

    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
}

bootstrap();
