import { Test, TestingModule } from '@nestjs/testing';
import { SlaService } from './sla.service';
import { ConfigService } from '@nestjs/config';

// ── Mock ConfigService ────────────────────────────────────────────────────────
const SLA_DEFAULTS: Record<string, string> = {
  SLA_CRITICAL_RESPONSE_MIN: '15',
  SLA_CRITICAL_RESOLVE_MIN:  '60',
  SLA_HIGH_RESPONSE_MIN:     '60',
  SLA_HIGH_RESOLVE_MIN:      '240',
  SLA_MEDIUM_RESPONSE_MIN:   '240',
  SLA_MEDIUM_RESOLVE_MIN:    '1440',
  SLA_LOW_RESPONSE_MIN:      '1440',
  SLA_LOW_RESOLVE_MIN:       '4320',
};

const mockConfigService = {
  get: jest.fn((key: string) => SLA_DEFAULTS[key]),
};

describe('SlaService', () => {
  let service: SlaService;
  const NOW = new Date('2025-01-01T12:00:00Z');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlaService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SlaService>(SlaService);
  });

  // ── CRITICAL ──────────────────────────────────────────────────────────────
  describe('getSlaDeadlines() — CRITICAL', () => {
    it('response deadline is 15 minutes from now', () => {
      const { responseAt } = service.getSlaDeadlines('CRITICAL', NOW);
      const diffMin = (responseAt.getTime() - NOW.getTime()) / 60_000;
      expect(diffMin).toBe(15);
    });

    it('resolve deadline is 60 minutes from now', () => {
      const { resolveAt } = service.getSlaDeadlines('CRITICAL', NOW);
      const diffMin = (resolveAt.getTime() - NOW.getTime()) / 60_000;
      expect(diffMin).toBe(60);
    });
  });

  // ── HIGH ──────────────────────────────────────────────────────────────────
  describe('getSlaDeadlines() — HIGH', () => {
    it('response deadline is 60 minutes from now', () => {
      const { responseAt } = service.getSlaDeadlines('HIGH', NOW);
      expect((responseAt.getTime() - NOW.getTime()) / 60_000).toBe(60);
    });

    it('resolve deadline is 4 hours from now', () => {
      const { resolveAt } = service.getSlaDeadlines('HIGH', NOW);
      expect((resolveAt.getTime() - NOW.getTime()) / 60_000).toBe(240);
    });
  });

  // ── MEDIUM ────────────────────────────────────────────────────────────────
  describe('getSlaDeadlines() — MEDIUM', () => {
    it('response deadline is 4 hours from now', () => {
      const { responseAt } = service.getSlaDeadlines('MEDIUM', NOW);
      expect((responseAt.getTime() - NOW.getTime()) / 60_000).toBe(240);
    });

    it('resolve deadline is 24 hours from now', () => {
      const { resolveAt } = service.getSlaDeadlines('MEDIUM', NOW);
      expect((resolveAt.getTime() - NOW.getTime()) / 60_000).toBe(1440);
    });
  });

  // ── LOW ───────────────────────────────────────────────────────────────────
  describe('getSlaDeadlines() — LOW', () => {
    it('response deadline is 24 hours from now', () => {
      const { responseAt } = service.getSlaDeadlines('LOW', NOW);
      expect((responseAt.getTime() - NOW.getTime()) / 60_000).toBe(1440);
    });

    it('resolve deadline is 3 days from now', () => {
      const { resolveAt } = service.getSlaDeadlines('LOW', NOW);
      expect((resolveAt.getTime() - NOW.getTime()) / 60_000).toBe(4320);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────────
  describe('Error handling', () => {
    it('throws when env var is missing', () => {
      mockConfigService.get.mockReturnValueOnce(undefined); // CRITICAL_RESPONSE missing
      expect(() => service.getSlaDeadlines('CRITICAL', NOW)).toThrow(
        'Missing required env variable',
      );
    });

    it('throws when env var is zero', () => {
      mockConfigService.get.mockReturnValueOnce('0');
      expect(() => service.getSlaDeadlines('CRITICAL', NOW)).toThrow(
        'must be a positive integer',
      );
    });

    it('throws when env var is not a number', () => {
      mockConfigService.get.mockReturnValueOnce('not-a-number');
      expect(() => service.getSlaDeadlines('CRITICAL', NOW)).toThrow();
    });
  });

  // ── resolveAt > responseAt invariant ─────────────────────────────────────
  describe('SLA ordering invariant', () => {
    (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).forEach((priority) => {
      it(`resolveAt > responseAt for ${priority}`, () => {
        // Restore default mock for all keys
        mockConfigService.get.mockImplementation((key: string) => SLA_DEFAULTS[key]);
        const { responseAt, resolveAt } = service.getSlaDeadlines(priority, NOW);
        expect(resolveAt.getTime()).toBeGreaterThan(responseAt.getTime());
      });
    });
  });
});
