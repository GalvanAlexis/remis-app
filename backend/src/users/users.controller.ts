import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto, UploadDriverDocumentsDto } from './dto/users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  async getMyProfile(@Request() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @Put('profile')
  async updateMyProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @Post('driver/documents')
  @UseGuards(RolesGuard)
  @Roles(Role.CHOFER)
  async uploadDriverDocuments(
    @Request() req,
    @Body() uploadDto: UploadDriverDocumentsDto,
  ) {
    return this.usersService.uploadDriverDocuments(req.user.id, uploadDto);
  }

  @Get('driver/documents')
  @UseGuards(RolesGuard)
  @Roles(Role.CHOFER)
  async getMyDriverDocuments(@Request() req) {
    return this.usersService.getDriverDocuments(req.user.id);
  }

  @Post('driver/:driverId/verify')
  async verifyDriver(
    @Param('driverId') driverId: string,
    @Body('isVerified') isVerified: boolean,
  ) {
    // TODO: Add admin role guard
    return this.usersService.verifyDriver(driverId, isVerified);
  }
}
