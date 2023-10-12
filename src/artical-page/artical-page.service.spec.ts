import { Test, TestingModule } from '@nestjs/testing';
import { ArticalPageService } from './artical-page.service';

describe('ArticalPageUsersService', () => {
    let service: ArticalPageService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ArticalPageService],
        }).compile();

        service = module.get<ArticalPageService>(ArticalPageService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
