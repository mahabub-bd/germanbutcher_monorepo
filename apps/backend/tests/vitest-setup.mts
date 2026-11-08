// Jest -> Vitest compatibility shim.
// Our specs only use `jest.fn()` (359 call sites, no spyOn/mock/fakeTimers),
// so mapping the `jest` global onto Vitest's `vi` is sufficient. `vi.fn()` is
// API-compatible for the mock* / mockResolved* methods the specs use.
import { vi } from 'vitest';

(globalThis as Record<string, unknown>).jest = vi;
