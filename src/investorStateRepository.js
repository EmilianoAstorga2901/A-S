import {
  INVESTOR_STATE_KIND,
  INVESTOR_STATE_SCHEMA_VERSION,
  investorStateContent,
  isLegacyProfileResult,
  migrateLegacyProfileResult,
  normalizeInvestorState,
  projectInvestorStateToLegacy,
  validateInvestorStateVersion,
} from './investorState.js';

export const INVESTOR_STATE_STORAGE_KEY = 'prisma-investor-state';
export const LEGACY_PROFILE_STORAGE_KEY = 'prisma-profile-result';
export const LEGACY_UPDATE_DOMAINS = Object.freeze([
  'financialSituation', 'risk', 'objectives', 'knowledge', 'behavior', 'preferences', 'evidence',
]);
const protectedStorageKeys = new Set([INVESTOR_STATE_STORAGE_KEY, LEGACY_PROFILE_STORAGE_KEY]);

const storageError = (error) => ({ name: error?.name || 'StorageError', message: error?.message || 'Storage operation failed' });

function readStorageValue(storage, key) {
  if (!storage || typeof storage.getItem !== 'function') return { status: 'storage_unavailable', raw: null, value: null };
  let raw;
  try { raw = storage.getItem(key); } catch (error) {
    return { status: 'storage_unavailable', raw: null, value: null, error: storageError(error) };
  }
  if (raw === null || raw === undefined || raw === '') return { status: 'missing', raw: null, value: null };
  try { return { status: 'valid', raw, value: JSON.parse(raw) }; } catch (error) {
    return { status: 'corrupt', raw, value: null, error: { name: 'SyntaxError', message: error.message } };
  }
}

function writeStorageValue(storage, key, value) {
  if (!storage || typeof storage.setItem !== 'function') return { ok: false, status: 'storage_unavailable' };
  try { storage.setItem(key, value); return { ok: true, status: 'written' }; } catch (error) {
    return { ok: false, status: 'write_failed', error: storageError(error) };
  }
}

function restoreStorageValue(storage, key, previous) {
  try {
    if (previous.status === 'missing') storage.removeItem(key);
    else storage.setItem(key, previous.raw);
    return { ok: true, status: 'restored' };
  } catch (error) {
    return { ok: false, status: 'rollback_failed', error: storageError(error) };
  }
}

function removeStorageValue(storage, key) {
  if (!storage || typeof storage.removeItem !== 'function') return { ok: false, status: 'storage_unavailable' };
  try { storage.removeItem(key); return { ok: true, status: 'removed' }; } catch (error) {
    return { ok: false, status: 'remove_failed', error: storageError(error) };
  }
}

function readRawStorageValue(storage, key) {
  if (!storage || typeof storage.getItem !== 'function') return { ok: false, status: 'storage_unavailable', raw: null };
  try {
    const value = storage.getItem(key);
    return value === null || value === undefined
      ? { ok: true, status: 'missing', raw: null }
      : { ok: true, status: 'present', raw: String(value) };
  } catch (error) {
    return { ok: false, status: 'storage_unavailable', raw: null, error: storageError(error) };
  }
}

const rawSnapshotMatches = (actual, expected) => actual.ok
  && actual.status === expected.status
  && actual.raw === expected.raw;

function restoreRawStorageSnapshot(storage, snapshots) {
  const errors = [];
  for (const [key, snapshot] of snapshots) {
    const restored = snapshot.status === 'missing'
      ? removeStorageValue(storage, key)
      : writeStorageValue(storage, key, snapshot.raw);
    if (!restored.ok) errors.push({ key, error: restored.error || { name: 'StorageError', message: restored.status } });
  }

  const verification = snapshots.map(([key, snapshot]) => ({ key, snapshot, actual: readRawStorageValue(storage, key) }));
  for (const item of verification) {
    if (!item.actual.ok) errors.push({ key: item.key, error: item.actual.error });
    else if (!rawSnapshotMatches(item.actual, item.snapshot)) {
      errors.push({ key: item.key, error: { name: 'RollbackVerificationError', message: 'Rollback postcondition was not met' } });
    }
  }
  return { ok: errors.length === 0, error: errors[0]?.error || null, errors };
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

const semanticallyEqual = (first, second) => JSON.stringify(canonicalize(first)) === JSON.stringify(canonicalize(second));

export function createLocalInvestorStateId(cryptoObject = globalThis.crypto) {
  if (typeof cryptoObject?.randomUUID === 'function') return `local-${cryptoObject.randomUUID()}`;
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function loadInvestorState(storage = globalThis.localStorage, options = {}) {
  const now = options.now || new Date().toISOString();
  const canonicalRead = readStorageValue(storage, INVESTOR_STATE_STORAGE_KEY);
  if (canonicalRead.status === 'storage_unavailable') {
    return { ok: false, status: 'storage_unavailable', state: null, legacyProfileResult: null, source: 'unavailable', error: canonicalRead.error };
  }
  if (canonicalRead.status === 'valid') {
    const version = validateInvestorStateVersion(canonicalRead.value);
    if (version.valid) {
      const state = normalizeInvestorState(canonicalRead.value, { now });
      return { ok: true, status: 'ok', state, legacyProfileResult: projectInvestorStateToLegacy(state), source: 'investor_state', error: null };
    }
    const legacyRead = readStorageValue(storage, LEGACY_PROFILE_STORAGE_KEY);
    if (legacyRead.status === 'storage_unavailable') {
      return { ok: false, status: 'storage_unavailable', state: null, legacyProfileResult: null, source: 'unavailable', error: legacyRead.error };
    }
    const legacy = legacyRead.status === 'valid' && isLegacyProfileResult(legacyRead.value) ? legacyRead.value : null;
    return { ok: false, status: 'unsupported', state: legacy ? migrateLegacyProfileResult(legacy, { id: options.id || 'local-profile', now }) : null, legacyProfileResult: legacy, source: legacy ? 'legacy_fallback' : 'unknown_version', error: version.reason };
  }

  const legacyRead = readStorageValue(storage, LEGACY_PROFILE_STORAGE_KEY);
  if (legacyRead.status === 'storage_unavailable') {
    return { ok: false, status: 'storage_unavailable', state: null, legacyProfileResult: null, source: 'unavailable', error: legacyRead.error };
  }
  const legacy = legacyRead.status === 'valid' && isLegacyProfileResult(legacyRead.value) ? legacyRead.value : null;
  if (canonicalRead.status === 'corrupt') {
    return { ok: false, status: 'corrupt', state: legacy ? migrateLegacyProfileResult(legacy, { id: options.id || 'local-profile', now }) : null, legacyProfileResult: legacy, source: legacy ? 'legacy_fallback' : 'corrupt', error: canonicalRead.error };
  }
  if (legacyRead.status === 'corrupt') {
    return { ok: false, status: 'corrupt', state: null, legacyProfileResult: null, source: 'legacy_corrupt', error: legacyRead.error };
  }
  if (legacy) {
    const state = migrateLegacyProfileResult(legacy, { id: options.id || 'local-profile', now });
    return { ok: true, status: 'ok', state, legacyProfileResult: legacy, source: 'legacy', error: null };
  }
  return { ok: true, status: 'empty', state: null, legacyProfileResult: null, source: 'empty', error: null };
}

function mergeLegacyIntoCanonical(existing, legacyProfileResult, options) {
  const migrated = migrateLegacyProfileResult(legacyProfileResult, options);
  if (!existing) return migrated;
  const changed = new Set(options.changedDomains);
  const next = {
    ...existing,
    compatibility: { ...existing.compatibility, legacyProfileResult: migrated.compatibility.legacyProfileResult },
  };
  if (changed.has('financialSituation')) next.financialSituation = { ...existing.financialSituation, ...migrated.financialSituation };
  if (changed.has('risk')) next.risk = { ...existing.risk, ...migrated.risk };
  if (changed.has('objectives')) next.objectives = migrated.objectives;
  if (changed.has('knowledge')) next.knowledge = { ...existing.knowledge, ...migrated.knowledge };
  if (changed.has('behavior')) next.behavior = { ...existing.behavior, ...migrated.behavior };
  if (changed.has('preferences')) next.preferences = {
    ...existing.preferences,
    ...migrated.preferences,
    explanationLevelOverride: changed.size === 1
      ? legacyProfileResult.profile?.explanation_level || null
      : existing.preferences.explanationLevelOverride,
  };
  if (changed.has('evidence')) next.evidence = { ...existing.evidence, ...migrated.evidence };
  return normalizeInvestorState(next, options);
}

function prepareSavedState(existing, candidate, now) {
  if (existing && semanticallyEqual(investorStateContent(existing), investorStateContent(candidate))) return { state: existing, changed: false };
  return { state: { ...candidate, id: existing?.id || candidate.id, revision: existing ? existing.revision + 1 : Math.max(1, candidate.revision), createdAt: existing?.createdAt || candidate.createdAt || now, updatedAt: now }, changed: true };
}

export function saveInvestorState(storage = globalThis.localStorage, candidate, options = {}) {
  const now = options.now || new Date().toISOString();
  const read = readStorageValue(storage, INVESTOR_STATE_STORAGE_KEY);
  if (read.status === 'storage_unavailable') return { ok: false, status: 'storage_unavailable', state: null, saved: false, error: read.error };
  if (read.status === 'corrupt') return { ok: false, status: 'corrupt', state: null, saved: false, error: read.error };
  const version = read.status === 'valid' ? validateInvestorStateVersion(read.value) : { valid: false };
  if (read.status === 'valid' && !version.valid) return { ok: false, status: 'unsupported', state: null, saved: false, error: version.reason };
  const existing = version.valid ? normalizeInvestorState(read.value, { now }) : null;
  if (existing && typeof candidate?.id === 'string' && candidate.id && candidate.id !== existing.id) {
    return { ok: false, status: 'identity_conflict', state: existing, saved: false, error: 'candidate_id_differs_from_stored_id' };
  }
  const state = normalizeInvestorState(candidate, { id: existing?.id || options.id || createLocalInvestorStateId(options.cryptoObject), now });
  if (!state) return { ok: false, status: 'invalid', state: existing, saved: false, error: 'invalid_or_unknown_schema_version' };
  const prepared = prepareSavedState(existing, state, now);
  if (!prepared.changed) return { ok: true, status: 'unchanged', state: existing, saved: false, error: null };
  const write = writeStorageValue(storage, INVESTOR_STATE_STORAGE_KEY, JSON.stringify(prepared.state));
  if (!write.ok) return { ok: false, status: write.status, state: existing, saved: false, error: write.error };
  return { ok: true, status: 'saved', state: prepared.state, saved: true, error: null };
}

export function saveLegacyProfileResult(storage = globalThis.localStorage, legacyProfileResult, options = {}) {
  if (!isLegacyProfileResult(legacyProfileResult)) return { ok: false, status: 'invalid', state: null, saved: false, error: 'invalid_legacy_profile' };
  if (!Array.isArray(options.changedDomains) || !options.changedDomains.length || options.changedDomains.some((domain) => !LEGACY_UPDATE_DOMAINS.includes(domain))) {
    return { ok: false, status: 'invalid_domains', state: null, saved: false, error: 'explicit_changed_domains_required' };
  }
  const now = options.now || new Date().toISOString();
  const loaded = loadInvestorState(storage, { ...options, now });
  if (['storage_unavailable', 'corrupt', 'unsupported'].includes(loaded.status)) return { ok: false, status: loaded.status, state: loaded.state, saved: false, error: loaded.error };
  const existing = loaded.source === 'investor_state' ? loaded.state : null;
  const state = mergeLegacyIntoCanonical(existing, legacyProfileResult, { ...options, id: loaded.state?.id || options.id || createLocalInvestorStateId(options.cryptoObject), now: loaded.state?.createdAt || now });
  const prepared = prepareSavedState(existing, state, now);
  if (!prepared.changed) return { ok: true, status: 'unchanged', state: existing, saved: false, error: null };

  const legacyRead = readStorageValue(storage, LEGACY_PROFILE_STORAGE_KEY);
  if (legacyRead.status === 'storage_unavailable') return { ok: false, status: 'storage_unavailable', state: existing, saved: false, error: legacyRead.error };
  if (legacyRead.status === 'corrupt') return { ok: false, status: 'corrupt', state: existing, saved: false, error: legacyRead.error };
  const legacyProjection = projectInvestorStateToLegacy(prepared.state);
  const legacyWrite = writeStorageValue(storage, LEGACY_PROFILE_STORAGE_KEY, JSON.stringify(legacyProjection));
  if (!legacyWrite.ok) return { ok: false, status: 'write_failed', state: existing, saved: false, error: legacyWrite.error };
  const canonicalWrite = writeStorageValue(storage, INVESTOR_STATE_STORAGE_KEY, JSON.stringify(prepared.state));
  if (!canonicalWrite.ok) {
    const rollback = restoreStorageValue(storage, LEGACY_PROFILE_STORAGE_KEY, legacyRead);
    return { ok: false, status: 'partial_failure', state: existing, saved: false, rolledBack: rollback.ok, error: canonicalWrite.error, rollbackError: rollback.error || null };
  }
  return { ok: true, status: 'saved', state: prepared.state, saved: true, error: null };
}

export function writeStorageJson(storage, key, value) {
  if (protectedStorageKeys.has(key)) return { ok: false, status: 'protected_key' };
  return writeStorageValue(storage, key, JSON.stringify(value));
}

export function readStorageText(storage, key) {
  const result = readStorageValue(storage, key);
  return {
    ok: ['missing', 'valid'].includes(result.status),
    status: result.status,
    value: result.status === 'valid' ? result.raw : null,
    error: result.error || null,
  };
}

export function writeStorageText(storage, key, value) {
  if (protectedStorageKeys.has(key)) return { ok: false, status: 'protected_key' };
  return writeStorageValue(storage, key, String(value));
}

export function removeStorageKeys(storage, keys = []) {
  if (!storage || typeof storage.removeItem !== 'function') return { ok: false, status: 'storage_unavailable', errors: [] };
  const errors = [];
  keys.forEach((key) => {
    if (protectedStorageKeys.has(key)) {
      errors.push({ key, error: { name: 'ProtectedStorageKey', message: 'Protected Prisma state key' } });
      return;
    }
    try { storage.removeItem(key); } catch (error) { errors.push({ key, error: storageError(error) }); }
  });
  return errors.length ? { ok: false, status: 'partial_failure', errors } : { ok: true, status: 'removed', errors: [] };
}

export function resetPrismaStateStorage(storage = globalThis.localStorage) {
  const canonical = readRawStorageValue(storage, INVESTOR_STATE_STORAGE_KEY);
  if (!canonical.ok) return { ok: false, status: 'storage_unavailable', rolledBack: null, error: canonical.error };
  const legacy = readRawStorageValue(storage, LEGACY_PROFILE_STORAGE_KEY);
  if (!legacy.ok) return { ok: false, status: 'storage_unavailable', rolledBack: null, error: legacy.error };
  const snapshots = [
    [INVESTOR_STATE_STORAGE_KEY, canonical],
    [LEGACY_PROFILE_STORAGE_KEY, legacy],
  ];
  const failWithRollback = (failureStatus, failedKey, error) => {
    const rollback = restoreRawStorageSnapshot(storage, snapshots);
    return {
      ok: false,
      status: rollback.ok ? failureStatus : 'rollback_failed',
      failureStatus,
      rolledBack: rollback.ok,
      failedKey,
      error: error || null,
      rollbackError: rollback.error,
    };
  };
  const verifyMissing = (key) => {
    const read = readRawStorageValue(storage, key);
    if (!read.ok) return { ok: false, status: 'verification_failed', error: read.error };
    if (read.status !== 'missing') {
      return { ok: false, status: 'postcondition_failed', error: { name: 'StoragePostconditionError', message: `${key} was not removed` } };
    }
    return { ok: true };
  };

  const legacyRemoval = removeStorageValue(storage, LEGACY_PROFILE_STORAGE_KEY);
  if (!legacyRemoval.ok) return failWithRollback('remove_failed', LEGACY_PROFILE_STORAGE_KEY, legacyRemoval.error);
  const legacyVerification = verifyMissing(LEGACY_PROFILE_STORAGE_KEY);
  if (!legacyVerification.ok) return failWithRollback(legacyVerification.status, LEGACY_PROFILE_STORAGE_KEY, legacyVerification.error);

  const canonicalRemoval = removeStorageValue(storage, INVESTOR_STATE_STORAGE_KEY);
  if (!canonicalRemoval.ok) return failWithRollback('remove_failed', INVESTOR_STATE_STORAGE_KEY, canonicalRemoval.error);
  const canonicalVerification = verifyMissing(INVESTOR_STATE_STORAGE_KEY);
  if (!canonicalVerification.ok) return failWithRollback(canonicalVerification.status, INVESTOR_STATE_STORAGE_KEY, canonicalVerification.error);

  const finalLegacy = verifyMissing(LEGACY_PROFILE_STORAGE_KEY);
  if (!finalLegacy.ok) return failWithRollback(finalLegacy.status, LEGACY_PROFILE_STORAGE_KEY, finalLegacy.error);
  const finalCanonical = verifyMissing(INVESTOR_STATE_STORAGE_KEY);
  if (!finalCanonical.ok) return failWithRollback(finalCanonical.status, INVESTOR_STATE_STORAGE_KEY, finalCanonical.error);
  return { ok: true, status: 'removed', rolledBack: null, error: null, rollbackError: null };
}

export const isPersistenceSuccess = (result) => result?.ok === true && ['saved', 'unchanged'].includes(result.status);

export function isStoredInvestorState(value) {
  return value?.kind === INVESTOR_STATE_KIND && value?.schemaVersion === INVESTOR_STATE_SCHEMA_VERSION;
}
