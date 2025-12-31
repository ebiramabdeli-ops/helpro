import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchingService } from './matching.service';
import { MatchingController } from './matching.controller';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { TasksModule } from '../tasks/tasks.module';
import { TrustEngineModule } from '../trust-engine/trust-engine.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, User]),
    TasksModule,
    TrustEngineModule,
  ],
  controllers: [MatchingController],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
