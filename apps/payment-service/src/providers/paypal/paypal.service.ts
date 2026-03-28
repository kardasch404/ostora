import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { Plan, PLAN_PRICES } from '../../subscription/plan.enum';

interface PayPalOrder {
  id: string;
  status: string;
  links: Array<{ href: string; rel: string }>;
}

interface PayPalSubscription {
  id: string;
  status: string;
  links?: Array<{ href: string; rel: string }>;
  subscriber: { email_address: string };
  billing_info: {
    next_billing_time: string;
    last_payment: { amount: { value: string } };
  };
}

@Injectable()
export class PayPalService {
  private readonly logger = new Logger(PayPalService.name);
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(private configService: ConfigService) {
    const mode = this.configService.get('PAYPAL_MODE') || 'sandbox';
    this.baseUrl = mode === 'live' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async getAccessToken(): Promise<string> {
    const clientId = this.configService.get('PAYPAL_CLIENT_ID');
    const clientSecret = this.configService.get('PAYPAL_CLIENT_SECRET');

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await axios.post(
      `${this.baseUrl}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    return response.data.access_token;
  }

  async createOrder(
    userId: string,
    plan: Plan,
    returnUrl: string,
    cancelUrl: string,
  ): Promise<PayPalOrder> {
    const token = await this.getAccessToken();
    const price = PLAN_PRICES[plan];

    if (!price || price.usd === 0) {
      throw new BadRequestException('Invalid plan for PayPal payment');
    }

    const response = await this.client.post(
      '/v2/checkout/orders',
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: userId,
            description: `Ostora ${plan} Subscription`,
            amount: {
              currency_code: 'USD',
              value: price.usd.toFixed(2),
            },
            custom_id: userId,
          },
        ],
        application_context: {
          brand_name: 'Ostora',
          return_url: returnUrl,
          cancel_url: cancelUrl,
          user_action: 'PAY_NOW',
        },
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    this.logger.log(`PayPal order created: ${response.data.id}`);
    return response.data;
  }

  async captureOrder(orderId: string): Promise<any> {
    const token = await this.getAccessToken();

    const response = await this.client.post(
      `/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    this.logger.log(`PayPal order captured: ${orderId}`);
    return response.data;
  }

  async createSubscription(
    userId: string,
    plan: Plan,
    returnUrl: string,
    cancelUrl: string,
  ): Promise<PayPalSubscription> {
    const token = await this.getAccessToken();
    const planId = this.getPayPalPlanId(plan);

    const response = await this.client.post(
      '/v1/billing/subscriptions',
      {
        plan_id: planId,
        custom_id: userId,
        application_context: {
          brand_name: 'Ostora',
          return_url: returnUrl,
          cancel_url: cancelUrl,
          user_action: 'SUBSCRIBE_NOW',
        },
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    this.logger.log(`PayPal subscription created: ${response.data.id}`);
    return response.data;
  }

  async cancelSubscription(subscriptionId: string, reason: string): Promise<void> {
    const token = await this.getAccessToken();

    await this.client.post(
      `/v1/billing/subscriptions/${subscriptionId}/cancel`,
      { reason },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    this.logger.log(`PayPal subscription cancelled: ${subscriptionId}`);
  }

  async getSubscription(subscriptionId: string): Promise<PayPalSubscription> {
    const token = await this.getAccessToken();

    const response = await this.client.get(
      `/v1/billing/subscriptions/${subscriptionId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    return response.data;
  }

  validateWebhookSignature(
    webhookId: string,
    transmissionId: string,
    transmissionTime: string,
    certUrl: string,
    transmissionSig: string,
    webhookEvent: any,
  ): boolean {
    // PayPal webhook signature validation
    // In production, implement full signature verification
    // https://developer.paypal.com/api/rest/webhooks/rest/#verify-webhook-signature
    
    void webhookId;
    void transmissionId;
    void transmissionTime;
    void certUrl;
    void transmissionSig;
    void webhookEvent;

    this.logger.log('Validating PayPal webhook signature');
    return true; // Simplified for now
  }

  private getPayPalPlanId(plan: Plan): string {
    const planIds: Partial<Record<Plan, string | undefined>> = {
      [Plan.PREMIUM_MONTHLY]: this.configService.get('PAYPAL_PLAN_PREMIUM_MONTHLY'),
      [Plan.PREMIUM_ANNUAL]: this.configService.get('PAYPAL_PLAN_PREMIUM_ANNUAL'),
      [Plan.B2B_STARTER]: this.configService.get('PAYPAL_PLAN_B2B_STARTER'),
      [Plan.B2B_PRO]: this.configService.get('PAYPAL_PLAN_B2B_PRO'),
    };

    const planId = planIds[plan];
    if (!planId) {
      throw new BadRequestException(`No PayPal plan configured for: ${plan}`);
    }
    return planId;
  }
}
