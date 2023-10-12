import { Test, TestingModule } from '@nestjs/testing';
import { HistoryLogsController } from './history-logs.controller';

describe('HistoryLogsController', () => {
  let controller: HistoryLogsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HistoryLogsController],
    }).compile();

    controller = module.get<HistoryLogsController>(HistoryLogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
