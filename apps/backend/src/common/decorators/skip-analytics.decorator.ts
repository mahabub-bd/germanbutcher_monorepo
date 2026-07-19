import { SetMetadata } from '@nestjs/common';

export const SKIP_ANALYTICS_KEY = 'skipAnalytics';

export const SkipAnalytics = () => SetMetadata(SKIP_ANALYTICS_KEY, true);
