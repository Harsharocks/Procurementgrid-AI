const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { validateRequest, evaluateDecision } = require('../procurement-policy');

const valid = {
  vendor: '  Acme Analytics  ', amount: '25000', seats: '50',
  team: 'Engineering', note: '  Improve deployment reporting.  '
};

test('normalizes a valid procurement request', () => {
  assert.deepEqual(validateRequest(valid), {
    ok: true,
    value: { vendor: 'Acme Analytics', amount: 25000, seats: 50,
      team: 'Engineering', note: 'Improve deployment reporting.' }
  });
});

test('rejects invalid vendor names and justifications', () => {
  for (const patch of [{ vendor: '  ' }, { vendor: 'x'.repeat(71) },
    { note: '' }, { note: 'x'.repeat(1001) }]) {
    assert.equal(validateRequest({ ...valid, ...patch }).ok, false);
  }
});

test('rejects non-finite, fractional and out-of-range budgets', () => {
  for (const amount of ['0', '-1', '1.5', 'Infinity', 'NaN', '100000001']) {
    assert.equal(validateRequest({ ...valid, amount }).ok, false, amount);
  }
});

test('rejects invalid seat counts and teams', () => {
  for (const seats of ['0', '-2', '1.2', '1000001', 'Infinity']) {
    assert.equal(validateRequest({ ...valid, seats }).ok, false, seats);
  }
  assert.equal(validateRequest({ ...valid, team: 'Unknown' }).ok, false);
});

test('allows a reviewed low-risk approval with trimmed rationale', () => {
  assert.deepEqual(evaluateDecision({ risk: 'Low' }, {
    status: 'Approved', rationale: '  Within budget  ', reviewsAttested: true
  }), { ok: true, rationale: 'Within budget' });
});

test('requires attestation before approval', () => {
  assert.equal(evaluateDecision({ risk: 'Medium' }, {
    status: 'Approved', rationale: 'Reviewed', reviewsAttested: false
  }).ok, false);
});

test('blocks high-risk approvals even with attestation', () => {
  assert.equal(evaluateDecision({ risk: 'High' }, {
    status: 'Approved', rationale: 'Reviewed', reviewsAttested: true
  }).ok, false);
});

test('permits high-risk rejection without approval attestation', () => {
  assert.deepEqual(evaluateDecision({ risk: 'High' }, {
    status: 'Rejected', rationale: '  Missing security evidence  ', reviewsAttested: false
  }), { ok: true, rationale: 'Missing security evidence' });
});

test('rejects empty, oversized and unknown decisions', () => {
  for (const rationale of ['', '   ', 'x'.repeat(1001)]) {
    assert.equal(evaluateDecision({ risk: 'Low' }, {
      status: 'Rejected', rationale, reviewsAttested: false
    }).ok, false);
  }
  assert.equal(evaluateDecision({ risk: 'Low' }, {
    status: 'Pending', rationale: 'Why', reviewsAttested: true
  }).ok, false);
});

test('fails closed when risk classification is absent', () => {
  assert.equal(evaluateDecision({}, {
    status: 'Approved', rationale: 'Reviewed', reviewsAttested: true
  }).ok, false);
});

test('browser entry point loads policy before application code', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /<script src="procurement-policy\.js"><\/script><script>/);
  const inline = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(inline, 'inline application script is present');
  new vm.Script(inline[1]);
  assert.match(inline[1], /ProcurementPolicy\.validateRequest/);
  assert.match(inline[1], /ProcurementPolicy\.evaluateDecision/);
});
