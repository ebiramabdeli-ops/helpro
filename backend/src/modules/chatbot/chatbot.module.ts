import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { IntentDetectionService } from './services/intent-detection.service';
import { DialogueStateService } from './services/dialogue-state.service';
import { DecisionEngineService } from './services/decision-engine.service';
import { ResponseGeneratorService } from './services/response-generator.service';

@Module({
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    IntentDetectionService,
    DialogueStateService,
    DecisionEngineService,
    ResponseGeneratorService,
  ],
  exports: [ChatbotService],
})
export class ChatbotModule {}
