import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { clerkClient } from '@clerk/clerk-sdk-node';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    if (!userId) {
      throw new UnauthorizedException('No user ID provided');
    }
    
    const user = await clerkClient.users.getUser(userId);
    const roles = await this.prisma.user_roles.findMany({
      where: { user_id: userId },
    });

    return {
      user: {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      roles,
    };
  }

  async verifyToken(token: string) {
    try {
      const verified = await clerkClient.verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      return verified;
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
