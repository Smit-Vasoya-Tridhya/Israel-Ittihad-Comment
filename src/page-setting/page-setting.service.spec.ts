import { Test, TestingModule } from '@nestjs/testing';
import { PageSettingService } from './page-setting.service';

describe('PageSettingService', () => {
  let service: PageSettingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PageSettingService],
    }).compile();

    service = module.get<PageSettingService>(PageSettingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
