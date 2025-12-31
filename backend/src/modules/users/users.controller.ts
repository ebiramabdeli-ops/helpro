import { 
  Controller, 
  Get, 
  Patch, 
  Body, 
  Param, 
  UseGuards, 
  Request 
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Request() req) {
    const { password, ...user } = await this.usersService.findById(req.user.id);
    return user;
  }

  @Patch('me')
  async updateMe(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    const { password, ...user } = await this.usersService.update(req.user.id, updateUserDto);
    return user;
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    const { password, ...user } = await this.usersService.findById(id);
    return user;
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  async getAllUsers() {
    return this.usersService.findAll();
  }

  @Patch(':id/ban')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async banUser(@Param('id') id: string, @Body('reason') reason: string) {
    return this.usersService.ban(id, reason);
  }

  @Patch(':id/unban')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async unbanUser(@Param('id') id: string) {
    return this.usersService.unban(id);
  }
}
