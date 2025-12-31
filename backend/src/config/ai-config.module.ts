import { Module, Global } from '@nestjs/common';
import { AIConfigService } from './ai-config.service';

@Global()
@Module({
  providers: [AIConfigService],
  exports: [AIConfigService],
})
export class AIConfigModule {}
