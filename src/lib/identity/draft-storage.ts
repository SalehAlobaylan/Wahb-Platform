import { identityCacheKey } from './identity-key';

const DRAFT_STORAGE_PREFIX = 'wahb_create_draft';

/** Opaque, identity-scoped local key; no raw account identifier reaches storage. */
export function createDraftStorageKey(userId?: string | null): string {
  return `${DRAFT_STORAGE_PREFIX}:${identityCacheKey(userId)}`;
}
