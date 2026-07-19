import { SetMetadata } from '@nestjs/common';

export const Menu = (menuPath: string) => SetMetadata('menu', menuPath);
