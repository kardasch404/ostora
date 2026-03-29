export class NotificationResponse {
  id!: string;
  userId!: string;
  type!: string;
  title!: string;
  message!: string;
  data?: any;
  read!: boolean;
  readAt?: Date;
  createdAt!: Date;
}
