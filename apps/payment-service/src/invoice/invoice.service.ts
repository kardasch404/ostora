import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { InvoicePdfService } from './invoice-pdf.service';

export interface Invoice {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: Date | null;
  createdAt: Date;
  plan: string;
  paymentMethod: string;
}

@Injectable()
export class InvoiceService {
  private prisma = new PrismaClient();

  constructor(private invoicePdfService: InvoicePdfService) {}

  async createInvoice(data: {
    userId: string;
    subscriptionId: string;
    amount: number;
    currency: string;
    plan: string;
    paymentMethod: string;
  }): Promise<Invoice> {
    const invoice = await this.prisma.invoice.create({
      data: {
        ...data,
        status: 'PENDING',
        invoiceNumber: this.generateInvoiceNumber(),
      },
    });

    return invoice;
  }

  async markAsPaid(invoiceId: string, paymentIntentId?: string): Promise<Invoice> {
    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paymentIntentId,
      },
    });
  }

  async getUserInvoices(userId: string): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInvoice(invoiceId: string): Promise<Invoice> {
    return this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        subscription: {
          select: {
            plan: true,
          },
        },
      },
    });
  }

  async generateInvoicePdf(invoiceId: string): Promise<Buffer> {
    const invoice = await this.getInvoice(invoiceId);
    return this.invoicePdfService.generatePdf(invoice);
  }

  private generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  }
}
