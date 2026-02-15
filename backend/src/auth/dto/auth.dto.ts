import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(Role)
  role: Role;

  @IsString()
  nombre: string;

  @IsString()
  apellido: string;

  @IsString()
  dni: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  profilePictureUrl?: string;

  // Campos específicos de Chofer
  @IsString()
  @IsOptional()
  licenciaUrl?: string;

  @IsString()
  @IsOptional()
  cedulaUrl?: string;

  @IsString()
  @IsOptional()
  habilitacionUrl?: string;

  @IsString()
  @IsOptional()
  maxPassengers?: string;

  @IsString()
  @IsOptional()
  vehicleModel?: string;

  @IsString()
  @IsOptional()
  vehiclePlate?: string;

  @IsString()
  @IsOptional()
  vehicleColor?: string;

  @IsString()
  @IsOptional()
  themePreference?: string;
}

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}

export class AuthResponseDto {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    username: string;
    role: Role;
    profile?: {
      nombre: string;
      apellido: string;
      themePreference: string;
    };
  };
}
