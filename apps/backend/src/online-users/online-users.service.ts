import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

export interface VisitorEntry {
  lastSeen: number;
  userId?: number;
  ipAddress: string;
  page?: string;
  userAgent?: string;
}

export interface OnlineUsersSummary {
  total: number;
  authenticated: number;
  guests: number;
}

const ONLINE_WINDOW_MS = 5 * 60 * 1000; // considered "online" for 5 minutes after last heartbeat
const CLEANUP_INTERVAL_MS = 60 * 1000;

@Injectable()
export class OnlineUsersService implements OnModuleInit, OnModuleDestroy {
  // key = visitorId (browser-generated UUID) or "ip:<address>" fallback
  private readonly visitors = new Map<string, VisitorEntry>();
  private cleanupTimer?: NodeJS.Timeout;

  onModuleInit() {
    this.cleanupTimer = setInterval(
      () => this.pruneStale(),
      CLEANUP_INTERVAL_MS,
    );
    // Don't keep the process alive just for the cleanup timer
    this.cleanupTimer.unref?.();
  }

  onModuleDestroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  heartbeat(
    visitorId: string,
    ipAddress: string,
    options: { userId?: number; page?: string; userAgent?: string } = {},
  ): void {
    this.visitors.set(visitorId, {
      lastSeen: Date.now(),
      ipAddress,
      userId: options.userId,
      page: options.page,
      userAgent: options.userAgent,
    });
  }

  getSummary(windowMs: number = ONLINE_WINDOW_MS): OnlineUsersSummary {
    const cutoff = Date.now() - windowMs;
    let authenticated = 0;
    let guests = 0;

    for (const entry of this.visitors.values()) {
      if (entry.lastSeen < cutoff) continue;
      if (entry.userId) {
        authenticated++;
      } else {
        guests++;
      }
    }

    return { total: authenticated + guests, authenticated, guests };
  }

  getOnlinePages(windowMs: number = ONLINE_WINDOW_MS): Record<string, number> {
    const cutoff = Date.now() - windowMs;
    const pages: Record<string, number> = {};

    for (const entry of this.visitors.values()) {
      if (entry.lastSeen < cutoff || !entry.page) continue;
      pages[entry.page] = (pages[entry.page] || 0) + 1;
    }

    return pages;
  }

  private pruneStale(windowMs: number = ONLINE_WINDOW_MS): void {
    const cutoff = Date.now() - windowMs;
    for (const [key, entry] of this.visitors) {
      if (entry.lastSeen < cutoff) {
        this.visitors.delete(key);
      }
    }
  }
}
