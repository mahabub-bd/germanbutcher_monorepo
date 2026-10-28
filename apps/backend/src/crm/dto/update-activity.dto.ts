import { PartialType } from '@nestjs/swagger';
import { CreateActivityDto } from './create-activity.dto';

/**
 * The customer comes from the route and the admin from the JWT —
 * neither is accepted in the body.
 */
export class UpdateActivityDto extends PartialType(CreateActivityDto) {}
