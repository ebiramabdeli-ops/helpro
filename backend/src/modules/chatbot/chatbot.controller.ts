import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export class ChatMessageDto {
  message: string;
  sessionId?: string;
  language?: 'en' | 'de' | 'sv' | 'es';
}

export class ChatbotResponseDto {
  message: string;
  sessionId: string;
  language: string;
  metadata?: {
    action: string;
    confidence: number;
    nextState: string;
  };
  quickReplies?: string[];
}

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  /**
   * Send message to chatbot
   */
  @Post('message')
  @UseGuards(JwtAuthGuard)
  async sendMessage(@Body() dto: ChatMessageDto, @Request() req: any): Promise<ChatbotResponseDto> {
    const userId = req.user.userId;

    const response = await this.chatbotService.processMessage(
      dto.message,
      userId,
      dto.sessionId,
      dto.language || 'en',
    );

    return response;
  }

  /**
   * Start new conversation
   */
  @Post('start')
  @UseGuards(JwtAuthGuard)
  async startConversation(@Request() req: any): Promise<{ sessionId: string; message: string }> {
    const userId = req.user.userId;
    return this.chatbotService.startConversation(userId);
  }

  /**
   * Get conversation context
   */
  @Get('session/:sessionId')
  @UseGuards(JwtAuthGuard)
  async getSession(@Param('sessionId') sessionId: string): Promise<any> {
    return this.chatbotService.getConversationContext(sessionId);
  }

  /**
   * End conversation
   */
  @Post('session/:sessionId/end')
  @UseGuards(JwtAuthGuard)
  async endSession(@Param('sessionId') sessionId: string): Promise<{ message: string }> {
    this.chatbotService.endConversation(sessionId);
    return { message: 'Session ended' };
  }

  /**
   * Health check
   */
  @Get('health')
  async health(): Promise<{ status: string; activeSessions: number }> {
    return this.chatbotService.healthCheck();
  }
}
