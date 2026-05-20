import { Controller, Get, Post, Body, Headers, UnauthorizedException, UseGuards, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from '@nexflow/shared-types';

@Controller('auth')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: any) {
    return this.appService.getMe(req.user.sub); 
  }

  @Post('verify-token')
  verifyToken(@Body('token') token: string) {
    if (!token) {
      throw new UnauthorizedException('Token is required');
    }
    return this.appService.verifyToken(token);
  }
}
