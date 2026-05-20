import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  ForbiddenException,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '@nexflow/shared-types';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email?: string;
    [key: string]: unknown;
  };
}

@Controller('auth')
export class AuthController {
  private clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY ?? '',
  });

  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /auth/me
   * Returns the authenticated user's Clerk profile merged with their RBAC roles.
   * Requires a valid Clerk Bearer token.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: AuthenticatedRequest) {
    const clerkUserId = req.user.sub;

    // Fetch roles from DB
    const roles = await this.prisma.user_roles.findMany({
      where: { user_id: clerkUserId },
      select: { role: true, project_id: true, id: true },
    });

    // Fetch Clerk user profile
    let clerkUser: { id: string; emailAddresses: { emailAddress: string }[]; firstName: string | null; lastName: string | null; imageUrl: string } | null = null;
    try {
      clerkUser = await this.clerk.users.getUser(clerkUserId);
    } catch {
      // If Clerk is unavailable, return what we have from the JWT
    }

    return {
      userId: clerkUserId,
      email: clerkUser?.emailAddresses?.[0]?.emailAddress ?? req.user.email,
      firstName: clerkUser?.firstName,
      lastName: clerkUser?.lastName,
      avatarUrl: clerkUser?.imageUrl,
      roles: roles.map((r) => ({
        id: r.id,
        role: r.role,
        projectId: r.project_id,
      })),
    };
  }

  /**
   * POST /auth/verify-token
   * Verifies a Clerk JWT and returns the decoded session payload.
   * Used by other services to validate tokens without importing Clerk directly.
   */
  @Post('verify-token')
  @HttpCode(HttpStatus.OK)
  async verifyToken(@Headers('authorization') authHeader: string) {
    const token = authHeader?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    try {
      const payload = await this.clerk.verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      return { valid: true, payload };
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * POST /auth/assign-role
   * Assigns an RBAC role to a user for an optional project scope.
   * Only a SUPER_ADMIN can call this endpoint.
   *
   * Body: { targetUserId: string, role: 'SUPER_ADMIN'|'PROJECT_ADMIN'|'AGENT'|'VIEWER', projectId?: string }
   */
  @Post('assign-role')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async assignRole(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      targetUserId: string;
      role: 'SUPER_ADMIN' | 'PROJECT_ADMIN' | 'AGENT' | 'VIEWER';
      projectId?: string;
    },
  ) {
    const callerUserId = req.user.sub;

    // Only SUPER_ADMINs can assign roles
    const callerRoles = await this.prisma.user_roles.findMany({
      where: { user_id: callerUserId, role: 'SUPER_ADMIN' },
    });
    if (callerRoles.length === 0) {
      throw new ForbiddenException('Only SUPER_ADMIN can assign roles');
    }

    // Upsert: one record per user+project+role combination
    const existing = await this.prisma.user_roles.findFirst({
      where: {
        user_id: body.targetUserId,
        role: body.role as any,
        project_id: body.projectId ?? null,
      },
    });

    if (existing) {
      return { message: 'Role already assigned', roleId: existing.id };
    }

    const created = await this.prisma.user_roles.create({
      data: {
        user_id: body.targetUserId,
        role: body.role as any,
        project_id: body.projectId ?? null,
      },
    });

    return { message: 'Role assigned successfully', roleId: created.id };
  }

  /**
   * GET /auth/health
   * Simple liveness endpoint — no auth required.
   */
  @Get('health')
  health() {
    return { status: 'ok', service: 'auth-service' };
  }
}
