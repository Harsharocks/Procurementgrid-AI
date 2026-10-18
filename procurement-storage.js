(function (root, factory) {
  const storage = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = storage;
  } else {
    root.ProcurementStorage = storage;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STATE_KEY = 'pg-state-v2';
  const LEGACY_DATA_KEY = 'pg-v1';
  const LEGACY_LOG_KEY = 'pg-log';
  const MAX_VENDORS = 1000;
  const MAX_LOGS = 500;
  const STATUSES = new Set(['Approved', 'Rejected', 'Blocked', 'In review']);
  const RISKS = new Set(['Low', 'Medium', 'High']);

  function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function boundedString(value, max) {
    return typeof value === 'string' && value.length > 0 && value.length <= max;
  }

  function integerInRange(value, min, max) {
    return Number.isSafeInteger(value) && value >= min && value <= max;
  }

  function validVendor(vendor) {
    return isRecord(vendor) && integerInRange(vendor.id, 1, Number.MAX_SAFE_INTEGER)
      && boundedString(vendor.name, 70) && boundedString(vendor.category, 80)
      && boundedString(vendor.owner, 80) && integerInRange(vendor.amount, 0, 100000000)
      && integerInRange(vendor.seats, 1, 1000000)
      && integerInRange(vendor.used, 0, vendor.seats)
      && RISKS.has(vendor.risk) && STATUSES.has(vendor.status)
      && integerInRange(vendor.days, 0, 36500)
      && integerInRange(vendor.score, 0, 100)
      && typeof vendor.color === 'string' && /^#[0-9a-f]{6}$/i.test(vendor.color)
      && typeof vendor.note === 'string' && vendor.note.length <= 1200;
  }

  function validVendors(vendors) {
    if (!Array.isArray(vendors) || vendors.length > MAX_VENDORS) return false;
    const ids = new Set();
    for (const vendor of vendors) {
      if (!validVendor(vendor) || ids.has(vendor.id)) return false;
      ids.add(vendor.id);
    }
    return true;
  }

  function validLogs(logs) {
    return Array.isArray(logs) && logs.length <= MAX_LOGS
      && logs.every(log => isRecord(log) && boundedString(log.text, 1500)
        && boundedString(log.time, 120));
  }

  function parse(raw) {
    return raw === null ? null : JSON.parse(raw);
  }

  function load(storage, seed) {
    if (!validVendors(seed)) throw new TypeError('Invalid application seed data.');
    const fallback = () => seed.map(vendor => ({ ...vendor }));
    let warning = null;
    let current;
    try {
      current = parse(storage.getItem(STATE_KEY));
      if (current !== null) {
        if (isRecord(current) && current.version === 2
          && validVendors(current.data) && validLogs(current.logs)) {
          return { data: current.data, logs: current.logs, warning: null };
        }
        warning = 'Saved workspace data is invalid. Trying the previous browser snapshot.';
      }
    } catch {
      warning = 'Could not read the saved workspace. Trying the previous browser snapshot.';
    }

    try {
      const legacyData = parse(storage.getItem(LEGACY_DATA_KEY));
      const legacyLogs = parse(storage.getItem(LEGACY_LOG_KEY));
      const dataValid = legacyData === null || validVendors(legacyData);
      const logsValid = legacyLogs === null || validLogs(legacyLogs);
      if (!dataValid || !logsValid) {
        warning = 'Some saved workspace data is invalid. Showing recoverable data; original storage was not deleted.';
      }
      return {
        data: dataValid && legacyData !== null ? legacyData : fallback(),
        logs: logsValid && legacyLogs !== null ? legacyLogs : [],
        warning
      };
    } catch {
      return {
        data: fallback(), logs: [],
        warning: 'Browser storage could not be read. Changes may last only for this session.'
      };
    }
  }

  function save(storage, data, logs) {
    if (!validVendors(data) || !validLogs(logs)) {
      return { ok: false, error: 'Workspace data is invalid and was not saved.' };
    }
    try {
      // One storage write prevents a partial vendor/log update after a quota failure.
      storage.setItem(STATE_KEY, JSON.stringify({ version: 2, data, logs }));
      return { ok: true };
    } catch {
      return { ok: false, error: 'Browser storage unavailable; changes last for this session.' };
    }
  }

  return Object.freeze({ load, save, MAX_LOGS });
});
