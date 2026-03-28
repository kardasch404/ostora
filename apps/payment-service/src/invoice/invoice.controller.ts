import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { InvoiceService } from './invoice.service';

@ApiTags('invoices')
@Controller('invoices')
@ApiBearerAuth()
export class InvoiceController {
  constructor(private invoiceService: InvoiceService) {}

  @Get()
  @ApiOperation({ summary: 'Get user billing history' })
  async getUserInvoices(@Req() req: any) {
    return this.invoiceService.getUserInvoices(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice details' })
  async getInvoice(@Param('id') id: string) {
    return this.invoiceService.getInvoice(id);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download invoice PDF' })
  async downloadInvoicePdf(@Param('id') id: string, @Res() res: Response) {
    const pdf = await this.invoiceService.generateInvoicePdf(id);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${id}.pdf`);
    res.send(pdf);
  }
}
