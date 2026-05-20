import { Test, TestingModule } from '@nestjs/testing';
import { WorkItemsController } from './work-items.controller';

describe('WorkItemsController', () => {
  let controller: WorkItemsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkItemsController],
    }).compile();

    controller = module.get<WorkItemsController>(WorkItemsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
