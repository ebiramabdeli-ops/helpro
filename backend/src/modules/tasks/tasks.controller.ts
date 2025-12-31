import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, TaskStatus } from '../../common/enums';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @UseGuards(RolesGuard)
  async create(@Request() req, @Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(req.user.id, createTaskDto);
  }

  @Get()
  async findAll(@Request() req, @Query() filters: any) {
    // Customers see their own tasks
    if (req.user.role === UserRole.CUSTOMER) {
      filters.customerId = req.user.id;
    }
    // Helpers see tasks assigned to them
    else if (req.user.role === UserRole.HELPER || req.user.role === UserRole.PRO) {
      filters.helperId = req.user.id;
    }
    // Admin sees all tasks (no filter)

    return this.tasksService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tasksService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, req.user.id, req.user.role, updateTaskDto);
  }

  @Post(':id/accept')
  @Roles(UserRole.HELPER, UserRole.PRO)
  @UseGuards(RolesGuard)
  async acceptTask(@Param('id') id: string, @Request() req) {
    return this.tasksService.acceptTask(id, req.user.id);
  }

  @Post(':id/start')
  @Roles(UserRole.HELPER, UserRole.PRO)
  @UseGuards(RolesGuard)
  async startTask(@Param('id') id: string, @Request() req) {
    return this.tasksService.startTask(id, req.user.id);
  }

  @Post(':id/complete')
  @Roles(UserRole.HELPER, UserRole.PRO)
  @UseGuards(RolesGuard)
  async completeTask(
    @Param('id') id: string,
    @Request() req,
    @Body('notes') notes?: string,
  ) {
    return this.tasksService.completeTask(id, req.user.id, notes);
  }

  @Post(':id/cancel')
  async cancelTask(
    @Param('id') id: string,
    @Request() req,
    @Body('reason') reason: string,
  ) {
    return this.tasksService.cancelTask(id, req.user.id, req.user.role, reason);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async updateStatus(
    @Param('id') id: string,
    @Request() req,
    @Body('status') status: TaskStatus,
  ) {
    return this.tasksService.updateStatus(id, status, req.user.id, req.user.role);
  }
}
