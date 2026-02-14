import { IsString, IsOptional, IsUrl, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  apellido?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  direccion?: string;
}

export class UploadDriverDocumentsDto {
  @IsUrl()
  @IsOptional()
  licenciaUrl?: string;

  @IsUrl()
  @IsOptional()
  cedulaUrl?: string;

  @IsUrl()
  @IsOptional()
  habilitacionUrl?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  maxPassengers?: number;
}

export class ProfileResponseDto {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  phone?: string;
  direccion?: string;
  userId: string;
}

export class DriverDocumentsResponseDto {
  id: string;
  licenciaUrl?: string;
  cedulaUrl?: string;
  habilitacionUrl?: string;
  maxPassengers?: number;
  isVerified: boolean;
  userId: string;
}

export class UserWithProfileDto {
  id: string;
  email: string;
  role: string;
  profile: ProfileResponseDto;
  driverDocument?: DriverDocumentsResponseDto;
}
