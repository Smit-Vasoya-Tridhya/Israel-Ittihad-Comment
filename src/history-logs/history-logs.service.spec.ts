import { Test, TestingModule } from '@nestjs/testing';
import { HistoryLogsService } from './history-logs.service';

describe('HistoryLogsService', () => {
  let service: HistoryLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HistoryLogsService],
    }).compile();

    service = module.get<HistoryLogsService>(HistoryLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
