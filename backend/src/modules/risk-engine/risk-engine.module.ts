import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiskEngineService } from './risk-engine.service';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Task])],
  providers: [RiskEngineService],
  exports: [RiskEngineService],
})
export class RiskEngineModule {}
