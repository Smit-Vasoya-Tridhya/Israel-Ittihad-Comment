import { Test, TestingModule } from '@nestjs/testing';
import { HarmfullWordController } from './harmfull-word.controller';

describe('HarmfullWordController', () => {
  let controller: HarmfullWordController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HarmfullWordController],
    }).compile();

    controller = module.get<HarmfullWordController>(HarmfullWordController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
