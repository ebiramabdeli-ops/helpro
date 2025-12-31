import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus, UserRole } from '../../common/enums';

@Injectable()
export class TasksService {
  // State machine: Valid transitions
  private readonly validTransitions: Record<TaskStatus, TaskStatus[]> = {
    [TaskStatus.CREATED]: [TaskStatus.MATCHING, TaskStatus.CANCELLED],
    [TaskStatus.MATCHING]: [TaskStatus.ASSIGNED, TaskStatus.CANCELLED],
    [TaskStatus.ASSIGNED]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
    [TaskStatus.IN_PROGRESS]: [TaskStatus.COMPLETED, TaskStatus.DISPUTED, TaskStatus.CANCELLED],
    [TaskStatus.COMPLETED]: [TaskStatus.DISPUTED],
    [TaskStatus.DISPUTED]: [TaskStatus.COMPLETED, TaskStatus.CANCELLED],
    [TaskStatus.CANCELLED]: [],
  };

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async create(customerId: string, createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      customerId,
      status: TaskStatus.CREATED,
    });
    
    return this.taskRepository.save(task);
  }

  async findAll(filters: any = {}): Promise<Task[]> {
    return this.taskRepository.find({
      where: filters,
      relations: ['customer', 'helper'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['customer', 'helper'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(
    id: string, 
    userId: string, 
    userRole: UserRole, 
    updateTaskDto: UpdateTaskDto
  ): Promise<Task> {
    const task = await this.findById(id);

    // Only customer can update their own tasks
    if (task.customerId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own tasks');
    }

    // Cannot update completed/cancelled tasks
    if ([TaskStatus.COMPLETED, TaskStatus.CANCELLED].includes(task.status)) {
      throw new BadRequestException('Cannot update completed or cancelled tasks');
    }

    Object.assign(task, updateTaskDto);
    return this.taskRepository.save(task);
  }

  async updateStatus(
    id: string, 
    newStatus: TaskStatus, 
    userId: string,
    userRole: UserRole
  ): Promise<Task> {
    const task = await this.findById(id);

    // Validate transition
    if (!this.isValidTransition(task.status, newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${task.status} to ${newStatus}`
      );
    }

    // Authorization checks
    this.checkStatusChangeAuthorization(task, newStatus, userId, userRole);

    task.status = newStatus;

    // Update timestamps based on status
    if (newStatus === TaskStatus.IN_PROGRESS) {
      task.actualStartTime = new Date();
    } else if (newStatus === TaskStatus.COMPLETED) {
      task.actualEndTime = new Date();
    }

    return this.taskRepository.save(task);
  }

  async assignHelper(taskId: string, helperId: string): Promise<Task> {
    const task = await this.findById(taskId);

    if (task.status !== TaskStatus.MATCHING) {
      throw new BadRequestException('Task must be in MATCHING status to assign a helper');
    }

    task.helperId = helperId;
    task.status = TaskStatus.ASSIGNED;
    task.matchingAttempts += 1;

    return this.taskRepository.save(task);
  }

  async acceptTask(taskId: string, helperId: string): Promise<Task> {
    const task = await this.findById(taskId);

    if (task.status !== TaskStatus.MATCHING) {
      throw new BadRequestException('Task must be in MATCHING status');
    }

    task.helperId = helperId;
    task.status = TaskStatus.ASSIGNED;

    return this.taskRepository.save(task);
  }

  async startTask(taskId: string, userId: string): Promise<Task> {
    const task = await this.findById(taskId);

    if (task.helperId !== userId) {
      throw new ForbiddenException('Only assigned helper can start the task');
    }

    if (task.status !== TaskStatus.ASSIGNED) {
      throw new BadRequestException('Task must be in ASSIGNED status');
    }

    task.status = TaskStatus.IN_PROGRESS;
    task.actualStartTime = new Date();

    return this.taskRepository.save(task);
  }

  async completeTask(
    taskId: string, 
    userId: string, 
    completionNotes?: string
  ): Promise<Task> {
    const task = await this.findById(taskId);

    if (task.helperId !== userId) {
      throw new ForbiddenException('Only assigned helper can complete the task');
    }

    if (task.status !== TaskStatus.IN_PROGRESS) {
      throw new BadRequestException('Task must be in IN_PROGRESS status');
    }

    task.status = TaskStatus.COMPLETED;
    task.actualEndTime = new Date();
    if (completionNotes) {
      task.completionNotes = completionNotes;
    }

    return this.taskRepository.save(task);
  }

  async cancelTask(
    taskId: string, 
    userId: string, 
    userRole: UserRole,
    reason: string
  ): Promise<Task> {
    const task = await this.findById(taskId);

    // Only customer or admin can cancel
    if (task.customerId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only task owner or admin can cancel');
    }

    if (task.status === TaskStatus.CANCELLED) {
      throw new BadRequestException('Task is already cancelled');
    }

    if (task.status === TaskStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed task');
    }

    task.status = TaskStatus.CANCELLED;
    task.cancellationReason = reason;

    return this.taskRepository.save(task);
  }

  private isValidTransition(currentStatus: TaskStatus, newStatus: TaskStatus): boolean {
    return this.validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  private checkStatusChangeAuthorization(
    task: Task,
    newStatus: TaskStatus,
    userId: string,
    userRole: UserRole
  ): void {
    // Admin can do anything
    if (userRole === UserRole.ADMIN) {
      return;
    }

    // Customer can cancel their own tasks
    if (newStatus === TaskStatus.CANCELLED && task.customerId === userId) {
      return;
    }

    // Helper can update progress
    if (task.helperId === userId && [
      TaskStatus.IN_PROGRESS,
      TaskStatus.COMPLETED,
    ].includes(newStatus)) {
      return;
    }

    throw new ForbiddenException('You are not authorized to change this task status');
  }
}
