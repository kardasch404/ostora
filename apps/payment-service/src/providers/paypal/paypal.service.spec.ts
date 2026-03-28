import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PayPalService } from '../../src/providers/paypal/paypal.service';

describe('PayPalService', () => {
  let service: PayPalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayPalService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                PAYPAL_CLIENT_ID: 'test_client_id',
                PAYPAL_CLIENT_SECRET: 'test_client_secret',
                PAYPAL_MODE: 'sandbox',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PayPalService>(PayPalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
