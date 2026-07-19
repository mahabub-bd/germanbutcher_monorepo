import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserType, AuditStatus } from '../entities/user-activity.entity';

export class CreateUserActivityDto {
  @IsNotEmpty()
  @IsString()
  action: string;

  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  entityId?: number;

  @IsOptional()
  oldValue?: Record<string, any>;

  @IsOptional()
  newValue?: Record<string, any>;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  requestId?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsEnum(AuditStatus)
  status?: AuditStatus;

  @IsOptional()
  @IsString()
  message?: string;
}
