import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateProfileDto,
  UploadDriverDocumentsDto,
  UserWithProfileDto,
} from './dto/users.dto';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        driverDocs: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile,
      driverDocument: user.driverDocs,
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedProfile = await this.prisma.profile.update({
      where: { userId },
      data: updateProfileDto,
    });

    return updatedProfile;
  }

  async uploadDriverDocuments(
    userId: string,
    uploadDto: UploadDriverDocumentsDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== Role.CHOFER) {
      throw new ForbiddenException('Only drivers can upload documents');
    }

    // Check if driver document already exists
    const existingDoc = await this.prisma.driverDocument.findUnique({
      where: { userId },
    });

    const maxPassengers = uploadDto.maxPassengers
      ? parseInt(uploadDto.maxPassengers, 10)
      : undefined;

    if (existingDoc) {
      // Update existing document
      return await this.prisma.driverDocument.update({
        where: { userId },
        data: {
          licenciaUrl: uploadDto.licenciaUrl,
          cedulaUrl: uploadDto.cedulaUrl,
          habilitacionUrl: uploadDto.habilitacionUrl,
          maxPassengers,
        },
      });
    } else {
      // Create new document
      return await this.prisma.driverDocument.create({
        data: {
          userId,
          licenciaUrl: uploadDto.licenciaUrl,
          cedulaUrl: uploadDto.cedulaUrl,
          habilitacionUrl: uploadDto.habilitacionUrl,
          maxPassengers,
          isVerified: false,
        },
      });
    }
  }

  async verifyDriver(driverId: string, isVerified: boolean) {
    const driver = await this.prisma.user.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    if (driver.role !== Role.CHOFER) {
      throw new ForbiddenException('User is not a driver');
    }

    const driverDoc = await this.prisma.driverDocument.findUnique({
      where: { userId: driverId },
    });

    if (!driverDoc) {
      throw new NotFoundException('Driver documents not found');
    }

    return await this.prisma.driverDocument.update({
      where: { userId: driverId },
      data: { isVerified },
    });
  }

  async getDriverDocuments(userId: string) {
    const driverDoc = await this.prisma.driverDocument.findUnique({
      where: { userId },
    });

    if (!driverDoc) {
      throw new NotFoundException('Driver documents not found');
    }

    return driverDoc;
  }
}
