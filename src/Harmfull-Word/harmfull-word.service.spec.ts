import { Test, TestingModule } from '@nestjs/testing';
import { HarmfullWordService } from './harmfull-word.service';

describe('HarmfullWordService', () => {
  let service: HarmfullWordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HarmfullWordService],
    }).compile();

    service = module.get<HarmfullWordService>(HarmfullWordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
