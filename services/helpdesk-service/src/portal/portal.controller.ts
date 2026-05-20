import {
  Controller, Post, Get, Body, Param, Query,
  Req, UnauthorizedException, NotFoundException,
} from '@nestjs/common';
import { PortalService } from './portal.service';
import { Request } from 'express';

/** Validates the portal JWT from the Authorization header. Returns the email claim. */
function extractPortalEmail(req: Request, portalService: PortalService): string {
  const auth = req.headers['authorization'] ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) throw new UnauthorizedException('Portal JWT required');
  return portalService.verifyPortalJwt(token).email;
}

@Controller('portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  // ── Public: no auth ────────────────────────────────────────────────────────

  @Post('auth/send-otp')
  sendOtp(@Body() body: { email: string }) {
    return this.portalService.sendOtp(body.email);
  }

  @Post('auth/verify-otp')
  verifyOtp(@Body() body: { email: string; otp: string }) {
    return this.portalService.verifyOtp(body.email, body.otp);
  }

  @Post('tickets')
  createTicket(@Body() body: {
    subject: string;
    description?: string;
    email: string;
    priority?: string;
  }) {
    return this.portalService.createPortalTicket(body);
  }

  @Get('tickets/:id/status')
  async getTicketStatus(@Param('id') id: string) {
    const ticket = await this.portalService.getTicketStatus(id);
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  // ── Portal JWT protected ───────────────────────────────────────────────────

  @Get('tickets')
  async getMyTickets(@Req() req: Request) {
    const email = extractPortalEmail(req, this.portalService);
    return this.portalService.getTicketsForEmail(email);
  }

  @Get('kb/search')
  async searchKb(@Query('q') q: string) {
    return this.portalService.searchKb(q);
  }
}
