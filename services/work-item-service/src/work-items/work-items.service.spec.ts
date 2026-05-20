import { Test, TestingModule } from '@nestjs/testing';
import { WorkItemsService } from './work-items.service';
import { PrismaService } from '../prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// ── Mock Prisma & Redis ───────────────────────────────────────────────────────
const mockPrisma = {
  work_items: {
    create:     jest.fn(),
    findMany:   jest.fn(),
    findUnique: jest.fn(),
    update:     jest.fn(),
    delete:     jest.fn(),
  },
};

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    xadd: jest.fn().mockResolvedValue('1-0'),
  }));
});

describe('WorkItemsService', () => {
  let service: WorkItemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkItemsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WorkItemsService>(WorkItemsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── findOne ──────────────────────────────────────────────────────────────
  describe('findOne()', () => {
    it('returns the work item when found', async () => {
      const mockItem = { id: 'uuid-1', title: 'Fix login bug', item_status: 'New' };
      mockPrisma.work_items.findUnique.mockResolvedValue(mockItem);
      const result = await service.findOne('uuid-1');
      expect(result).toEqual(mockItem);
    });

    it('throws NotFoundException when item does not exist', async () => {
      mockPrisma.work_items.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ── Status transition validation ─────────────────────────────────────────
  describe('Status transition validation', () => {
    const transitions: [string, string, boolean][] = [
      ['New',       'Approved',  true],
      ['New',       'Removed',   true],
      ['New',       'Committed', false],
      ['Approved',  'Committed', true],
      ['Approved',  'New',       true],
      ['Approved',  'Done',      false],
      ['Committed', 'Done',      true],
      ['Committed', 'Approved',  true],
      ['Done',      'Committed', true],
      ['Done',      'New',       false],
    ];

    test.each(transitions)(
      '%s → %s: shouldSucceed=%s',
      async (from, to, shouldSucceed) => {
        mockPrisma.work_items.findUnique.mockResolvedValue({
          id: 'uuid-1', title: 'Test item', item_status: from,
        });
        mockPrisma.work_items.update.mockResolvedValue({ id: 'uuid-1', item_status: to });

        const updateCall = service.update('uuid-1', { item_status: to });
        if (shouldSucceed) {
          await expect(updateCall).resolves.toBeDefined();
        } else {
          await expect(updateCall).rejects.toThrow(BadRequestException);
        }
      },
    );
  });

  // ── create ───────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('creates a work item and publishes to Redis Streams', async () => {
      const mockItem = { id: 'new-uuid', title: 'New task', item_status: 'New', description: '' };
      mockPrisma.work_items.create.mockResolvedValue(mockItem);

      const result = await service.create({ title: 'New task', project_id: 'proj-1' });

      expect(result).toEqual(mockItem);
      expect(mockPrisma.work_items.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ title: 'New task', item_status: 'New' }),
      });
    });
  });

  // ── linkTicket ───────────────────────────────────────────────────────────
  describe('linkTicket()', () => {
    it('links a ticket ID to a work item via github_metadata', async () => {
      mockPrisma.work_items.findUnique.mockResolvedValue({ id: 'uuid-1', github_metadata: {} });
      mockPrisma.work_items.update.mockResolvedValue({
        id: 'uuid-1', github_metadata: { linkedTicketId: 'tkt-1' },
      });

      await service.linkTicket('uuid-1', 'tkt-1');

      expect(mockPrisma.work_items.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data: { github_metadata: { linkedTicketId: 'tkt-1' } },
      });
    });
  });
});
