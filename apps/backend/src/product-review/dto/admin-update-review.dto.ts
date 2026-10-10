import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class AdminUpdateReviewDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Approve the review (makes it publicly visible). Clears the rejected flag.',
  })
  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Reject the review (hides it and marks it as rejected). Clears the approved flag.',
  })
  @IsOptional()
  @IsBoolean()
  isRejected?: boolean;
}
