/**
 * Extracts the real client IP address from the request.
 * Handles various proxy headers like X-Forwarded-For, CF-Connecting-IP, etc.
 *
 * @param req - Express request object
 * @returns The real client IP address
 */
export function getClientIp(req: any): string {
  // Check X-Forwarded-For header (most common)
  // Format: X-Forwarded-For: <client>, <proxy1>, <proxy2>
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, the first one is the client
    const ips = forwardedFor.split(',').map((ip: string) => ip.trim());
    const clientIp = ips[0];

    // Validate it's an IP and not a local/internal IP
    if (clientIp && !isInternalIp(clientIp)) {
      return clientIp;
    }
  }

  // Check CF-Connecting-IP header (Cloudflare)
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp && !isInternalIp(cfIp)) {
    return cfIp;
  }

  // Check X-Real-IP header (Nginx)
  const realIp = req.headers['x-real-ip'];
  if (realIp && !isInternalIp(realIp)) {
    return realIp;
  }

  // Check True-Client-IP header (Akamai)
  const trueClientIp = req.headers['true-client-ip'];
  if (trueClientIp && !isInternalIp(trueClientIp)) {
    return trueClientIp;
  }

  // Fall back to req.ip (Express will use the leftmost IP when trust proxy is enabled)
  const ip = req.ip || req.connection?.remoteAddress;
  if (ip) {
    // Remove IPv6 prefix if present (::ffff:)
    const cleanIp = ip.replace(/^::ffff:/, '');

    // Only return if it's not an internal IP
    if (!isInternalIp(cleanIp)) {
      return cleanIp;
    }
  }

  return 'unknown';
}

/**
 * Checks if an IP address is internal/private
 */
function isInternalIp(ip: string): boolean {
  // Check for localhost
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    return true;
  }

  // Check for private IP ranges
  const privateRanges = [
    /^10\./,                              // 10.0.0.0/8
    /^172\.(1[6-9]|2\d|3[01])\./,        // 172.16.0.0/12
    /^192\.168\./,                        // 192.168.0.0/16
    /^fc00:/i,                            // fc00::/7 (IPv6 private)
    /^fe80:/i,                            // fe80::/10 (IPv6 link-local)
    /^::1$/i,                             // IPv6 localhost
    /^::ffff:(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/, // IPv4-mapped IPv6 private IPs
  ];

  return privateRanges.some(range => range.test(ip));
}
