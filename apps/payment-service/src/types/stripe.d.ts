declare module 'stripe' {
	class Stripe {
		constructor(apiKey: string, config?: { apiVersion?: string });

		customers: {
			create(params: any): Promise<any>;
			update(id: string, params: any): Promise<any>;
		};
		paymentIntents: {
			create(params: any): Promise<any>;
		};
		subscriptions: {
			create(params: any): Promise<any>;
			cancel(id: string): Promise<any>;
			update(id: string, params: any): Promise<any>;
			retrieve(id: string): Promise<any>;
		};
		paymentMethods: {
			attach(id: string, params: any): Promise<any>;
		};
		webhooks: {
			constructEvent(payload: Buffer, signature: string, secret: string): any;
		};
	}

	namespace Stripe {
		type Event = any;
		type PaymentIntent = any;
		type Invoice = any;
		type Subscription = any;
		namespace Subscription {
			type Status = string;
		}
		type SubscriptionCreateParams = any;
	}

	export = Stripe;
}
