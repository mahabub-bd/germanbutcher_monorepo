import { vi } from 'vitest';

import { FlashSaleCampaignsService } from './flash-sale-campaigns.service';

function makeQueryBuilder(rows: unknown[]) {
  return {
    leftJoinAndSelect: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    getMany: vi.fn().mockResolvedValue(rows),
  };
}

function makeService(rows: unknown[] = []) {
  const queryBuilder = makeQueryBuilder(rows);
  const repository = {
    createQueryBuilder: vi.fn().mockReturnValue(queryBuilder),
    findOne: vi.fn(),
    create: vi.fn((value) => value),
    save: vi.fn(async (value) => value),
    remove: vi.fn(),
  };
  const service = new FlashSaleCampaignsService(repository as any);
  return { service, repository, queryBuilder };
}

describe('FlashSaleCampaignsService.getActiveCampaigns', () => {
  it('queries the DB once and reuses the in-process cache', async () => {
    const { service, repository } = makeService();

    await service.getActiveCampaigns();
    await service.getActiveCampaigns();

    expect(repository.createQueryBuilder).toHaveBeenCalledTimes(1);
  });

  it('re-evaluates the validity window per call from the cached rows', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
      const { service, repository } = makeService([
        { id: 1, validFrom: new Date('2026-01-01T00:00:10Z'), validUntil: null },
      ]);

      expect(await service.getActiveCampaigns()).toHaveLength(0);

      // 15s later the row is still inside the 30s fresh window, so it comes
      // from memory — but the campaign has now started and must be included.
      vi.setSystemTime(new Date('2026-01-01T00:00:15Z'));
      expect(await service.getActiveCampaigns()).toHaveLength(1);
      expect(repository.createQueryBuilder).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('invalidates the cache after an admin mutation', async () => {
    const { service, repository } = makeService();
    repository.findOne.mockResolvedValue({
      id: 1,
      isActive: true,
      validFrom: null,
      validUntil: null,
      products: [],
      categories: [],
    });

    await service.getActiveCampaigns();
    await service.update(1, {} as any);
    await service.getActiveCampaigns();

    expect(repository.createQueryBuilder).toHaveBeenCalledTimes(2);
  });
});
