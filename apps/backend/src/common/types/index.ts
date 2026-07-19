import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty()
  message: string;

  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  data: T;

  total?: number;

  page?: number;

  limit?: number;

  totalPages?: number;
}

export interface SslcommerzConfig {
  storeId: string;
  storePassword: string;
  isLive: boolean;
}

export const toNumber = (value: any): number => {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};
