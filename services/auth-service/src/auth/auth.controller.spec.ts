import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma.service';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';

// ── Mock Prisma ───────────────────────────────────────────────────────────────
const mockPrismaService = {
  user_roles: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

// ── Mock Clerk SDK ────────────────────────────────────────────────────────────
jest.mock('@clerk/clerk-sdk-node', () => ({
  createClerkClient: jest.fn(() => ({
    users: { getUser: jest.fn() },
    verifyToken: jest.fn(),
  })),
}));

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  describe('health()', () => {
    it('returns ok status', () => {
      const result = controller.health();
      expect(result).toEqual({ status: 'ok', service: 'auth-service' });
    });
  });

  describe('getMe()', () => {
    it('returns user info with empty roles when user has no roles', async () => {
      mockPrismaService.user_roles.findMany.mockResolvedValue([]);

      // Access private clerk field via any cast
      (controller as any).clerk.users.getUser.mockResolvedValue({
        id: 'user_abc',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: 'Test',
        lastName: 'User',
        imageUrl: 'https://example.com/avatar.jpg',
      });

      const mockReq = { user: { sub: 'user_abc', email: 'test@example.com' } } as any;
      const result = await controller.getMe(mockReq);

      expect(result.userId).toBe('user_abc');
      expect(result.email).toBe('test@example.com');
      expect(result.roles).toEqual([]);
    });

    it('returns roles from the database', async () => {
      mockPrismaService.user_roles.findMany.mockResolvedValue([
        { id: 'role_1', role: 'AGENT', project_id: 'proj_1' },
      ]);
      (controller as any).clerk.users.getUser.mockResolvedValue({
        id: 'user_abc',
        emailAddresses: [{ emailAddress: 'agent@example.com' }],
        firstName: 'Agent',
        lastName: 'Smith',
        imageUrl: '',
      });

      const mockReq = { user: { sub: 'user_abc' } } as any;
      const result = await controller.getMe(mockReq);

      expect(result.roles).toHaveLength(1);
      expect(result.roles[0].role).toBe('AGENT');
      expect(result.roles[0].projectId).toBe('proj_1');
    });
  });

  describe('verifyToken()', () => {
    it('throws UnauthorizedException when no token in header', async () => {
      await expect(controller.verifyToken('')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when token verification fails', async () => {
      (controller as any).clerk.verifyToken.mockRejectedValue(new Error('Invalid token'));
      await expect(controller.verifyToken('Bearer bad.token')).rejects.toThrow(UnauthorizedException);
    });

    it('returns valid:true when token verifies successfully', async () => {
      const mockPayload = { sub: 'user_123', exp: 9999999999 };
      (controller as any).clerk.verifyToken.mockResolvedValue(mockPayload);

      const result = await controller.verifyToken('Bearer valid.clerk.token');
      expect(result.valid).toBe(true);
      expect(result.payload).toEqual(mockPayload);
    });
  });

  describe('assignRole()', () => {
    it('throws ForbiddenException if caller is not SUPER_ADMIN', async () => {
      mockPrismaService.user_roles.findMany.mockResolvedValue([]); // no SUPER_ADMIN roles

      const mockReq = { user: { sub: 'caller_user' } } as any;
      await expect(
        controller.assignRole(mockReq, { targetUserId: 'target_user', role: 'AGENT' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('returns existing roleId when role already assigned', async () => {
      mockPrismaService.user_roles.findMany.mockResolvedValue([{ id: 'sr_1' }]); // caller is SUPER_ADMIN
      mockPrismaService.user_roles.findFirst.mockResolvedValue({ id: 'existing_role' });

      const mockReq = { user: { sub: 'admin_user' } } as any;
      const result = await controller.assignRole(mockReq, { targetUserId: 'target', role: 'AGENT' });

      expect(result.message).toBe('Role already assigned');
      expect(result.roleId).toBe('existing_role');
    });

    it('creates a new role assignment for a SUPER_ADMIN caller', async () => {
      mockPrismaService.user_roles.findMany.mockResolvedValue([{ id: 'sr_1' }]);
      mockPrismaService.user_roles.findFirst.mockResolvedValue(null);
      mockPrismaService.user_roles.create.mockResolvedValue({ id: 'new_role_123' });

      const mockReq = { user: { sub: 'admin_user' } } as any;
      const result = await controller.assignRole(mockReq, { targetUserId: 'target', role: 'VIEWER', projectId: 'proj_1' });

      expect(result.message).toBe('Role assigned successfully');
      expect(result.roleId).toBe('new_role_123');
      expect(mockPrismaService.user_roles.create).toHaveBeenCalledWith({
        data: {
          user_id: 'target',
          role: 'VIEWER',
          project_id: 'proj_1',
        },
      });
    });
  });
});
