const COOLDOWN_MS = 5 * 60 * 1000;
let lastSyncAt = 0;

/**
 * Check if sync is allowed under global cooldown.
 * @returns {boolean}
 */
function canSync() {
    return Date.now() - lastSyncAt >= COOLDOWN_MS;
}

/**
 * Record a sync attempt timestamp.
 */
function markSynced() {
    lastSyncAt = Date.now();
}

module.exports = { canSync, markSynced, COOLDOWN_MS };
