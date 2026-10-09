import { SetMetadata } from '@nestjs/common';

export const HTTP_CACHE_METADATA_KEY = 'httpCacheSeconds';

/** Mark a GET handler's response as publicly cacheable for the given number
 * of seconds (Cache-Control: public, max-age=N, stale-while-revalidate). */
export const HttpCache = (seconds: number) =>
  SetMetadata(HTTP_CACHE_METADATA_KEY, seconds);
