import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Normalizar username a minúsculas para búsqueda case-insensitive
    const normalizedUsername = registerDto.username.toLowerCase().trim();

    // Check if username already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (existingUser) {
      throw new ConflictException('El nombre de usuario ya está registrado');
    }

    // Check if DNI already exists
    const existingDni = await this.prisma.profile.findUnique({
      where: { dni: registerDto.dni },
    });

    if (existingDni) {
      throw new ConflictException('El DNI ya está registrado');
    }

    // Validaciones de unicidad para documentos del chofer
    if (registerDto.role === Role.CHOFER) {
      const plate = registerDto.vehiclePlate?.toUpperCase();

      const [dupLicencia, dupCedula, dupHabilitacion, dupPatente] =
        await Promise.all([
          registerDto.licenciaUrl
            ? this.prisma.driverDocument.findUnique({
                where: { licenciaUrl: registerDto.licenciaUrl },
              })
            : null,
          registerDto.cedulaUrl
            ? this.prisma.driverDocument.findUnique({
                where: { cedulaUrl: registerDto.cedulaUrl },
              })
            : null,
          registerDto.habilitacionUrl
            ? this.prisma.driverDocument.findUnique({
                where: { habilitacionUrl: registerDto.habilitacionUrl },
              })
            : null,
          plate
            ? this.prisma.driverDocument.findUnique({
                where: { vehiclePlate: plate },
              })
            : null,
        ]);

      if (dupLicencia)
        throw new ConflictException(
          'El número de licencia ya está registrado en otro chofer',
        );
      if (dupCedula)
        throw new ConflictException(
          'La cédula verde/azul ya está registrada en otro vehículo',
        );
      if (dupHabilitacion)
        throw new ConflictException(
          'El número de habilitación ya está registrado',
        );
      if (dupPatente)
        throw new ConflictException(
          'La patente ya está registrada en otro vehículo',
        );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    try {
      // Create user and profile in transaction
      const user = await this.prisma.user.create({
        data: {
          username: normalizedUsername,
          password: hashedPassword,
          role: registerDto.role,
          profile: {
            create: {
              nombre: registerDto.nombre,
              apellido: registerDto.apellido,
              dni: registerDto.dni,
              direccion: registerDto.direccion,
              profilePictureUrl: registerDto.profilePictureUrl,
              themePreference: registerDto.themePreference || 'EXECUTIVE',
            },
          },
          ...(registerDto.role === Role.CHOFER && {
            driverDocs: {
              create: {
                licenciaUrl: registerDto.licenciaUrl,
                cedulaUrl: registerDto.cedulaUrl,
                habilitacionUrl: registerDto.habilitacionUrl,
                maxPassengers: registerDto.maxPassengers ?? null,
                vehicleModel: registerDto.vehicleModel,
                vehiclePlate: registerDto.vehiclePlate
                  ? registerDto.vehiclePlate.toUpperCase()
                  : undefined,
                vehicleColor: registerDto.vehicleColor,
                // Auto-verificación: el formato ya fue validado por el DTO,
                // la unicidad por los checks anteriores. No hay admin manual.
                isVerified: true,
                verifiedAt: new Date(),
              },
            },
          }),
        },
        include: {
          profile: true,
          driverDocs: true,
        },
      });

      // Generate tokens
      const tokens = await this.generateTokens(
        user.id,
        user.username,
        user.role,
      );

      return {
        ...tokens,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          profile: user.profile
            ? {
                nombre: user.profile.nombre,
                apellido: user.profile.apellido,
                themePreference: user.profile.themePreference,
              }
            : undefined,
        },
      };
    } catch (error: any) {
      // Manejar errores de unicidad de Prisma (P2002 = unique constraint violation)
      if (error.code === 'P2002') {
        const fieldMap: Record<string, string> = {
          licenciaUrl: 'El número de licencia ya está registrado',
          cedulaUrl: 'El número de cédula ya está registrado',
          vehiclePlate: 'La patente ya está registrada',
          username: 'El nombre de usuario ya está registrado',
          dni: 'El DNI ya está registrado',
        };
        const field = error.meta?.target?.[0] as string;
        throw new ConflictException(
          fieldMap[field] || `El campo '${field}' ya está registrado`,
        );
      }
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Normalizar username a minúsculas para login case-insensitive
    const normalizedUsername = loginDto.username.toLowerCase().trim();

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { username: normalizedUsername },
      include: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.username, user.role);

    return {
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        profile: user.profile
          ? {
              nombre: user.profile.nombre,
              apellido: user.profile.apellido,
              themePreference: user.profile.themePreference,
            }
          : undefined,
      },
    };
  }

  private async generateTokens(userId: string, username: string, role: Role) {
    const payload = { sub: userId, username, role };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        expiresIn: '7d',
      }),
    ]);

    return {
      access_token,
      refresh_token,
    };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
        profile: true,
      },
    });
  }
}
