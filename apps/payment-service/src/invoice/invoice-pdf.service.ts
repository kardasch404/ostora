import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class InvoicePdfService {
  async generatePdf(invoice: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(20)
        .text('OSTORA', 50, 50)
        .fontSize(10)
        .text('Job Platform', 50, 75)
        .text('Casablanca, Morocco', 50, 90)
        .text('contact@ostora.com', 50, 105);

      // Invoice title
      doc
        .fontSize(20)
        .text('INVOICE', 400, 50, { align: 'right' })
        .fontSize(10)
        .text(`Invoice #: ${invoice.invoiceNumber}`, 400, 75, { align: 'right' })
        .text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 400, 90, { align: 'right' })
        .text(`Status: ${invoice.status}`, 400, 105, { align: 'right' });

      // Line
      doc
        .moveTo(50, 140)
        .lineTo(550, 140)
        .stroke();

      // Bill to
      doc
        .fontSize(12)
        .text('Bill To:', 50, 160)
        .fontSize(10)
        .text(`${invoice.user.firstName} ${invoice.user.lastName}`, 50, 180)
        .text(invoice.user.email, 50, 195);

      // Table header
      const tableTop = 250;
      doc
        .fontSize(10)
        .text('Description', 50, tableTop, { bold: true })
        .text('Plan', 250, tableTop)
        .text('Amount', 450, tableTop, { align: 'right' });

      // Line
      doc
        .moveTo(50, tableTop + 20)
        .lineTo(550, tableTop + 20)
        .stroke();

      // Table content
      const itemY = tableTop + 30;
      doc
        .text('Subscription', 50, itemY)
        .text(invoice.plan, 250, itemY)
        .text(`${invoice.amount} ${invoice.currency}`, 450, itemY, { align: 'right' });

      // Total
      const totalY = itemY + 50;
      doc
        .moveTo(50, totalY)
        .lineTo(550, totalY)
        .stroke();

      doc
        .fontSize(12)
        .text('Total:', 350, totalY + 10)
        .text(`${invoice.amount} ${invoice.currency}`, 450, totalY + 10, { align: 'right' });

      // Footer
      doc
        .fontSize(8)
        .text('Thank you for your business!', 50, 700, { align: 'center' })
        .text('For questions, contact support@ostora.com', 50, 715, { align: 'center' });

      doc.end();
    });
  }
}
