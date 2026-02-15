import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class CreateRideRequestDto {
  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  guestName?: string;

  @IsOptional()
  @IsString()
  guestPhone?: string;

  @IsOptional()
  @IsString()
  detalle?: string;

  @IsString()
  originAddress: string;

  @IsString()
  destAddress: string;
}

export class CreateOfferDto {
  @IsString()
  rideRequestId: string;

  @IsString()
  driverId: string;

  @IsNumber()
  @Min(1)
  estimatedMinutes: number;

  @IsNumber()
  @Min(0)
  quotedPrice: number;
}

export class AcceptOfferDto {
  @IsString()
  rideId: string;

  @IsString()
  offerId: string;
}

export class UpdateDriverStatusDto {
  @IsString()
  userId: string;

  @IsBoolean()
  isOnline: boolean;

  @IsBoolean()
  onlyRegistered: boolean;
}

export class RatingDto {
  @IsString()
  rideId: string;

  @IsString()
  fromUserId: string;

  @IsString()
  toUserId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  score: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
