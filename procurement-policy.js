(function (root, factory) {
  const policy = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = policy;
  } else {
    root.ProcurementPolicy = policy;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const TEAMS = new Set(['Engineering', 'Design', 'Operations', 'Data', 'Finance']);
  const RISKS = new Set(['Low', 'Medium', 'High']);

  function validateRequest(input) {
    const vendor = String(input?.vendor ?? '').trim();
    const note = String(input?.note ?? '').trim();
    const team = String(input?.team ?? '').trim();
    const amount = Number(input?.amount);
    const seats = Number(input?.seats);

    if (!vendor || vendor.length > 70) {
      return { ok: false, error: 'Vendor name must be 1–70 characters.' };
    }
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100000000) {
      return { ok: false, error: 'Annual budget must be a whole dollar amount from 1 to 100,000,000.' };
    }
    if (!Number.isSafeInteger(seats) || seats < 1 || seats > 1000000) {
      return { ok: false, error: 'Requested seats must be a whole number from 1 to 1,000,000.' };
    }
    if (!TEAMS.has(team)) {
      return { ok: false, error: 'Choose a valid owner team.' };
    }
    if (!note || note.length > 1000) {
      return { ok: false, error: 'Business justification must be 1–1,000 characters.' };
    }
    return { ok: true, value: { vendor, amount, seats, team, note } };
  }

  function evaluateDecision(vendor, decision) {
    if (!vendor || !RISKS.has(vendor.risk)) {
      return { ok: false, error: 'Vendor risk assessment is missing or invalid.' };
    }
    if (!decision || !['Approved', 'Rejected'].includes(decision.status)) {
      return { ok: false, error: 'Choose a valid decision.' };
    }
    const rationale = String(decision.rationale ?? '').trim();
    if (!rationale || rationale.length > 1000) {
      return { ok: false, error: 'Decision rationale must be 1–1,000 characters.' };
    }
    if (decision.status === 'Approved' && vendor.risk === 'High') {
      return { ok: false, error: 'High-risk vendors cannot be approved until their risk is cleared.' };
    }
    if (decision.status === 'Approved' && decision.reviewsAttested !== true) {
      return { ok: false, error: 'Confirm the required reviews before approving.' };
    }
    return { ok: true, rationale };
  }

  return Object.freeze({ validateRequest, evaluateDecision });
});
