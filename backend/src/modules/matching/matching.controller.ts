import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@Controller('matching')
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  /**
   * Find best matches for a task
   */
  @Get('task/:taskId')
  async findMatches(@Param('taskId') taskId: string) {
    return this.matchingService.findBestMatches(taskId);
  }

  /**
   * Auto-assign best helper (Admin/System)
   */
  @Post('task/:taskId/auto-assign')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async autoAssign(@Param('taskId') taskId: string) {
    return this.matchingService.autoAssignTask(taskId);
  }

  /**
   * Re-match a task (after cancellation)
   */
  @Post('task/:taskId/rematch')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async rematch(@Param('taskId') taskId: string) {
    return this.matchingService.rematchTask(taskId);
  }
}
