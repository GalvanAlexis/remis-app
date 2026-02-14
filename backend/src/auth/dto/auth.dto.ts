import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email: string;

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
  phone?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

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
  maxPassengers?: string; // Lo recibimos como string y lo convertimos
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class AuthResponseDto {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    role: Role;
  };
}
