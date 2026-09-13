import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DOMAINS, Domain, OperationsService } from './operations.service';

@Controller()
export class OperationsController {
  constructor(private readonly operations: OperationsService) {}
  @Get(':domain') catalog(@Param('domain') domain: Domain) { return this.operations.catalog(this.validate(domain)); }
  @Post(':domain/:action') action(@Param('domain') domain: Domain, @Param('action') action: string, @Body() body: Record<string, unknown>) { return this.operations.action(this.validate(domain), action, body); }
  private validate(domain: Domain): Domain { if (!DOMAINS.includes(domain)) throw new Error(`Unknown Nexora domain: ${domain}`); return domain; }
}
