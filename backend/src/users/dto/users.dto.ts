import { IsString, IsOptional, IsUrl } from 'class-validator';

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

  @IsString()
  @IsOptional()
  maxPassengers?: string; // Will be converted to Int
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
