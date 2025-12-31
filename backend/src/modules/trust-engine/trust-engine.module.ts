import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrustEngineService } from './trust-engine.service';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [TrustEngineService],
  exports: [TrustEngineService],
})
export class TrustEngineModule {}
