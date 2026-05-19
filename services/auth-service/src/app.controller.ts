import { Controller, Get, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('auth')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('me')
  getMe(@Headers('x-user-id') userId: string) {
    return this.appService.getMe(userId);
  }

  @Post('verify-token')
  verifyToken(@Body('token') token: string) {
    if (!token) {
      throw new UnauthorizedException('Token is required');
    }
    return this.appService.verifyToken(token);
  }
}
