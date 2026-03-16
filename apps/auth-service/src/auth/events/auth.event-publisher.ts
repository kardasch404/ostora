import { Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { AuthEvents } from './auth-events.enum';

@Injectable()
export class AuthEventPublisher {
  constructor(@Inject('KAFKA_CLIENT') private kafkaClient: ClientKafka) {}

  async onModuleInit() {
    const events = Object.values(AuthEvents);
    events.forEach((event) => {
      this.kafkaClient.subscribeToResponseOf(event);
    });
    await this.kafkaClient.connect();
  }


      timestamp: new Date().toISOString(),
    });
  }


      timestamp: new Date().toISOString(),
    });
  }


      timestamp: new Date().toISOString(),
    });
  }
}
