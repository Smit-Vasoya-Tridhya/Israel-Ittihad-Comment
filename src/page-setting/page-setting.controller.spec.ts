import { Test, TestingModule } from '@nestjs/testing';
import { PageSettingController } from './page-setting.controller';

describe('PageSettingController', () => {
  let controller: PageSettingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PageSettingController],
    }).compile();

    controller = module.get<PageSettingController>(PageSettingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
