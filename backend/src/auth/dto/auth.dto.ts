import {
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsOptional,
  Matches,
  IsNumberString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @IsEnum(Role)
  role: Role;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  nombre: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  apellido: string;

  // DNI: 7 u 8 dígitos numéricos
  @Matches(/^\d{7,8}$/, {
    message: 'El DNI debe tener 7 u 8 dígitos numéricos',
  })
  dni: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  direccion?: string;

  @IsString()
  @IsOptional()
  profilePictureUrl?: string;

  @IsString()
  @IsOptional()
  themePreference?: string;

  // --- Campos específicos de Chofer ---

  // Nº Licencia: alfanumérico, 5-15 caracteres
  @IsOptional()
  @Matches(/^[A-Z0-9]{5,15}$/i, {
    message:
      'El número de licencia debe tener entre 5 y 15 caracteres alfanuméricos',
  })
  licenciaUrl?: string;

  // Nº Cédula: alfanumérico, 5-15 caracteres
  @IsOptional()
  @Matches(/^[A-Z0-9]{5,15}$/i, {
    message:
      'El número de cédula debe tener entre 5 y 15 caracteres alfanuméricos',
  })
  cedulaUrl?: string;

  // Nº Habilitación: alfanumérico con guiones, 3-20 caracteres
  @IsOptional()
  @Matches(/^[A-Z0-9\-]{3,20}$/i, {
    message: 'La habilitación debe tener entre 3 y 20 caracteres alfanuméricos',
  })
  habilitacionUrl?: string;

  // Pasajeros máximos: número entre 1 y 20
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La cantidad de pasajeros debe ser un número entero' })
  @Min(1, { message: 'Mínimo 1 pasajero' })
  @Max(20, { message: 'Máximo 20 pasajeros' })
  maxPassengers?: number;

  // Modelo del vehículo: texto libre, 3-60 chars
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'El modelo debe tener al menos 3 caracteres' })
  @MaxLength(60)
  vehicleModel?: string;

  // Patente argentina: formato ABC123 (viejo) o AB123CD (nuevo Mercosur)
  @IsOptional()
  @Matches(/^[A-Z]{2,3}\d{3}[A-Z]{0,2}$/i, {
    message: 'La patente debe tener formato válido (ej: ABC123 o AB123CD)',
  })
  vehiclePlate?: string;

  // Color: solo letras y espacios, 3-20 chars
  @IsOptional()
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]{3,20}$/, {
    message: 'El color debe contener solo letras (3-20 caracteres)',
  })
  vehicleColor?: string;
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
