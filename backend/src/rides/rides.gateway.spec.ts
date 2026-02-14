import { Test, TestingModule } from '@nestjs/testing';
import { RidesGateway } from './rides.gateway';

describe('RidesGateway', () => {
  let gateway: RidesGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RidesGateway],
    }).compile();

    gateway = module.get<RidesGateway>(RidesGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
