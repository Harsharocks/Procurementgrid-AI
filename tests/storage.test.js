const test = require('node:test');
const assert = require('node:assert/strict');
const { load, save, MAX_LOGS } = require('../procurement-storage');

const seed = [{ id: 1, name: 'Acme', category: 'Design', owner: 'Design', amount: 84000,
  seats: 280, used: 224, risk: 'Low', status: 'Approved', days: 28,
  score: 91, color: '#f4e4ef', note: 'Sample vendor' }];
const log = { text: 'Acme approved', time: '2026-10-18 11:00' };

function fakeStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value)
  };
}

test('fresh workspace loads independent seed objects', () => {
  const result = load(fakeStorage(), seed);
  assert.deepEqual(result, { data: seed, logs: [], warning: null });
  result.data[0].name = 'Changed';
  assert.equal(seed[0].name, 'Acme');
});

test('atomic save and reload keeps data and logs together', () => {
  const storage = fakeStorage();
  assert.deepEqual(save(storage, seed, [log]), { ok: true });
  assert.deepEqual(load(storage, seed), { data: seed, logs: [log], warning: null });
  assert.deepEqual(JSON.parse(storage.values.get('pg-state-v2')).version, 2);
  assert.equal(storage.values.size, 1);
});

test('existing legacy data and logs migrate without modifying legacy keys', () => {
  const storage = fakeStorage({ 'pg-v1': JSON.stringify(seed), 'pg-log': JSON.stringify([log]) });
  assert.deepEqual(load(storage, seed), { data: seed, logs: [log], warning: null });
  assert.equal(storage.values.has('pg-state-v2'), false);
  assert.deepEqual(save(storage, seed, [log]), { ok: true });
  assert.equal(storage.values.has('pg-v1'), true);
  assert.equal(storage.values.has('pg-log'), true);
});

test('invalid current snapshot falls back to valid legacy snapshot', () => {
  const storage = fakeStorage({ 'pg-state-v2': '{bad', 'pg-v1': JSON.stringify(seed) });
  const result = load(storage, seed);
  assert.deepEqual(result.data, seed);
  assert.match(result.warning, /saved workspace/i);
  assert.equal(storage.values.get('pg-state-v2'), '{bad');
});

test('corrupt legacy vendor data falls back to seed without deleting storage', () => {
  const storage = fakeStorage({ 'pg-v1': JSON.stringify([{ ...seed[0], color: 'red";x' }]),
    'pg-log': JSON.stringify([log]) });
  const result = load(storage, seed);
  assert.deepEqual(result.data, seed);
  assert.deepEqual(result.logs, [log]);
  assert.match(result.warning, /invalid/i);
  assert.equal(storage.values.has('pg-v1'), true);
});

test('invalid logs are isolated from valid vendors', () => {
  const storage = fakeStorage({ 'pg-v1': JSON.stringify(seed), 'pg-log': JSON.stringify({ x: 1 }) });
  const result = load(storage, seed);
  assert.deepEqual(result.data, seed);
  assert.deepEqual(result.logs, []);
  assert.match(result.warning, /invalid/i);
});

test('rejects invalid state without touching previously saved snapshot', () => {
  const storage = fakeStorage();
  assert.deepEqual(save(storage, seed, [log]), { ok: true });
  const previous = storage.values.get('pg-state-v2');
  assert.equal(save(storage, [{ ...seed[0], seats: 0 }], []).ok, false);
  assert.equal(save(storage, seed, Array(MAX_LOGS + 1).fill(log)).ok, false);
  assert.equal(save(storage, [seed[0], seed[0]], []).ok, false);
  assert.equal(storage.values.get('pg-state-v2'), previous);
});

test('blocked and quota-limited storage fail without throwing', () => {
  const blocked = { getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('quota'); } };
  const result = load(blocked, seed);
  assert.deepEqual(result.data, seed);
  assert.match(result.warning, /storage/i);
  assert.equal(save(blocked, seed, [log]).ok, false);
});

test('unknown state version never silently overrides existing legacy data', () => {
  const storage = fakeStorage({ 'pg-state-v2': JSON.stringify({ version: 99, data: [], logs: [] }),
    'pg-v1': JSON.stringify(seed) });
  const result = load(storage, seed);
  assert.deepEqual(result.data, seed);
  assert.match(result.warning, /invalid/i);
});
