import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to manually set old record for audit logging
 * Usage in controllers:
 *
 * @Patch(':id')
 * @UseDecorators(SetOldRecord(oldRecord))
 * async update(@Param('id') id: number, @Body() updateDto: any) {
 *   // First fetch the old record
 *   const oldRecord = await this.service.findOne(id);
 *   // Set it to request for the interceptor
 *   const req = Request();
 *   (req as any).oldRecord = oldRecord;
 *
 *   // Then proceed with update
 *   return this.service.update(id, updateDto);
 * }
 */

export const SetOldRecord = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.oldRecord;
  },
);
