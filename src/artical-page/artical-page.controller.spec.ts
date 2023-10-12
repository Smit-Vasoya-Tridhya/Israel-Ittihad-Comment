import { Test, TestingModule } from '@nestjs/testing';
import { ArticalPageController } from './artical-page.controller';

describe('ArticalPageUsersController', () => {
    let controller: ArticalPageController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ArticalPageController],
        }).compile();

        controller = module.get<ArticalPageController>(ArticalPageController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
