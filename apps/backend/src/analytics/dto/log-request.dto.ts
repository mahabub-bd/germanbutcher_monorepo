import { IsDefined, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class LogRequestDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  endpoint: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  method: string;

  @IsDefined()
  @IsNumber()
  statusCode: number;

  @IsDefined()
  @IsNumber()
  responseTime: number;

  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  ipAddress: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsDefined()
  isAuthenticated: boolean;
}
