import { Module } from '@nestjs/common';

    PrismaModule,
    RedisModule,
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'auth-service',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9095'],
          },
          consumer: {
            groupId: 'auth-service-consumer',
          },
        },
      },
    ]),
  ],
  controllers: [AuthController],

})
export class AuthModule {}
