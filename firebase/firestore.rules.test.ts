/**
 * Firestore security-rules emulator tests — WP-8
 *
 * Covers the three Phase-2 subcollections added by WP-8:
 *   users/{uid}/learnerModel/{docId}
 *   users/{uid}/practiceState/{topicId}
 *   users/{uid}/practiceXp/{docId}
 *
 * Run via:
 *   firebase emulators:exec --only firestore,auth \
 *     "npx vitest run firebase/firestore.rules.test.ts"
 *
 * Or with a running emulator:
 *   npx vitest run firebase/firestore.rules.test.ts
 */

import { describe, it, beforeAll, afterAll, afterEach } from 'vitest';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RULES_PATH = resolve(__dirname, 'firestore.rules');

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-rules-test',
    firestore: {
      rules: readFileSync(RULES_PATH, 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

// ─── helpers ────────────────────────────────────────────────────────────────

const UID_A = 'user-alice';
const UID_B = 'user-bob';

function authAs(uid: string) {
  return testEnv.authenticatedContext(uid);
}

const unauthed = () => testEnv.unauthenticatedContext();

// ─── learnerModel/{docId} ────────────────────────────────────────────────────

describe('users/{uid}/learnerModel/{docId}', () => {
  it('owner A can write their own learnerModel/state', async () => {
    const db = authAs(UID_A).firestore();
    await assertSucceeds(
      db.doc(`users/${UID_A}/learnerModel/state`).set({ ratings: {} }),
    );
  });

  it('owner A can read their own learnerModel/state', async () => {
    // seed via admin
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`users/${UID_A}/learnerModel/state`).set({ ratings: {} });
    });
    const db = authAs(UID_A).firestore();
    await assertSucceeds(db.doc(`users/${UID_A}/learnerModel/state`).get());
  });

  it('user B is denied read on A ownership of learnerModel/state', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`users/${UID_A}/learnerModel/state`).set({ ratings: {} });
    });
    const db = authAs(UID_B).firestore();
    await assertFails(db.doc(`users/${UID_A}/learnerModel/state`).get());
  });

  it('user B is denied write on A ownership of learnerModel/state', async () => {
    const db = authAs(UID_B).firestore();
    await assertFails(
      db.doc(`users/${UID_A}/learnerModel/state`).set({ ratings: {} }),
    );
  });

  it('unauthenticated user is denied read on learnerModel/state', async () => {
    const db = unauthed().firestore();
    await assertFails(db.doc(`users/${UID_A}/learnerModel/state`).get());
  });
});

// ─── practiceState/{topicId} ─────────────────────────────────────────────────

describe('users/{uid}/practiceState/{topicId}', () => {
  it('owner A can write their own practiceState/probability-basics', async () => {
    const db = authAs(UID_A).firestore();
    await assertSucceeds(
      db
        .doc(`users/${UID_A}/practiceState/probability-basics`)
        .set({ rating: 1000, attempts: 0, correct: 0, lastSeenTemplateIds: [], updatedAt: new Date() }),
    );
  });

  it('owner A can read their own practiceState/probability-basics', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx
        .firestore()
        .doc(`users/${UID_A}/practiceState/probability-basics`)
        .set({ rating: 1000, attempts: 0, correct: 0, lastSeenTemplateIds: [], updatedAt: new Date() });
    });
    const db = authAs(UID_A).firestore();
    await assertSucceeds(db.doc(`users/${UID_A}/practiceState/probability-basics`).get());
  });

  it('user B is denied read on A ownership of practiceState/{x}', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx
        .firestore()
        .doc(`users/${UID_A}/practiceState/probability-basics`)
        .set({ rating: 1000 });
    });
    const db = authAs(UID_B).firestore();
    await assertFails(db.doc(`users/${UID_A}/practiceState/probability-basics`).get());
  });

  it('user B is denied write on A ownership of practiceState/{x}', async () => {
    const db = authAs(UID_B).firestore();
    await assertFails(
      db.doc(`users/${UID_A}/practiceState/probability-basics`).set({ rating: 9999 }),
    );
  });

  it('unauthenticated user is denied read on practiceState/{x}', async () => {
    const db = unauthed().firestore();
    await assertFails(db.doc(`users/${UID_A}/practiceState/probability-basics`).get());
  });
});

// ─── practiceXp/{docId} ──────────────────────────────────────────────────────

describe('users/{uid}/practiceXp/{docId}', () => {
  it('owner A can write their own practiceXp/today', async () => {
    const db = authAs(UID_A).firestore();
    await assertSucceeds(
      db.doc(`users/${UID_A}/practiceXp/today`).set({ date: '2026-06-25', earnedToday: 0 }),
    );
  });

  it('owner A can read their own practiceXp/today', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx
        .firestore()
        .doc(`users/${UID_A}/practiceXp/today`)
        .set({ date: '2026-06-25', earnedToday: 0 });
    });
    const db = authAs(UID_A).firestore();
    await assertSucceeds(db.doc(`users/${UID_A}/practiceXp/today`).get());
  });

  it('user B is denied read on A ownership of practiceXp/today', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx
        .firestore()
        .doc(`users/${UID_A}/practiceXp/today`)
        .set({ date: '2026-06-25', earnedToday: 0 });
    });
    const db = authAs(UID_B).firestore();
    await assertFails(db.doc(`users/${UID_A}/practiceXp/today`).get());
  });

  it('user B is denied write on A ownership of practiceXp/today', async () => {
    const db = authAs(UID_B).firestore();
    await assertFails(
      db.doc(`users/${UID_A}/practiceXp/today`).set({ date: '2026-06-25', earnedToday: 99 }),
    );
  });

  it('unauthenticated user is denied read on practiceXp/today', async () => {
    const db = unauthed().firestore();
    await assertFails(db.doc(`users/${UID_A}/practiceXp/today`).get());
  });
});
