/**
 * Firestore security-rules emulator tests — WP-CW-C
 *
 * Covers the Captain's Wager collections added by WP-CW-C:
 *   /wagers/{wagerId}
 *   /wagers/{wagerId}/private/{stateDoc}
 *   /wagers/{wagerId}/submissions/{uid}
 *   /users/{uid}/wagerStats/{statDoc}
 *
 * Run via:
 *   firebase emulators:exec --only firestore,auth \
 *     "npx vitest run --config firebase/vitest.config.ts firebase/rules-tests/wagers.test.ts"
 *
 * Or with an already-running emulator:
 *   npx vitest run --config firebase/vitest.config.ts firebase/rules-tests/wagers.test.ts
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
const RULES_PATH = resolve(__dirname, '../firestore.rules');

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

// ─── constants & helpers ─────────────────────────────────────────────────────

const WAGER_ID = 'test-wager-2026';
const UID_A = 'user-alice';
const UID_B = 'user-bob';

function authAs(uid: string) {
  return testEnv.authenticatedContext(uid);
}
const unauthed = () => testEnv.unauthenticatedContext();

/** A valid WagerSubmission payload (C-W1 shape, non-placeholder). */
function validSubmission(uid: string) {
  return {
    uid,
    guess: 50.7,
    logError: 0.012,
    score: 99,
    submittedAt: new Date(), // compat SDK converts Date → Timestamp; satisfies `is timestamp` rule check
  };
}

/** A placeholder submission written by the two-step submit flow (step 1). */
function placeholderSubmission(uid: string) {
  return {
    uid,
    guess: 50.7,
    logError: 0,
    score: 0,
    submittedAt: new Date(),
  };
}

/** Seed the wager doc, bypassing rules. */
async function seedWager() {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx
      .firestore()
      .doc(`wagers/${WAGER_ID}`)
      .set({ prompt: 'Birthday paradox', status: 'live', sequence: 1 });
  });
}

/** Seed the private/answer doc, bypassing rules. */
async function seedAnswerDoc() {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx
      .firestore()
      .doc(`wagers/${WAGER_ID}/private/answer`)
      .set({
        trueAnswer: 50.7,
        source: 'Standard calculation',
        revealHeadline: 'Birthday paradox',
        revealExplanation: 'Pairs grow combinatorially.',
      });
  });
}

/** Seed a submission for the given uid, bypassing rules. */
async function seedSubmission(uid: string) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx
      .firestore()
      .doc(`wagers/${WAGER_ID}/submissions/${uid}`)
      .set(validSubmission(uid));
  });
}

/** Seed a placeholder submission (score=0, logError=0) for the given uid, bypassing rules. */
async function seedPlaceholderSubmission(uid: string) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx
      .firestore()
      .doc(`wagers/${WAGER_ID}/submissions/${uid}`)
      .set(placeholderSubmission(uid));
  });
}

// ─── /wagers/{wagerId} ───────────────────────────────────────────────────────

describe('/wagers/{wagerId}', () => {
  it('authenticated user can read a wager doc', async () => {
    await seedWager();
    const db = authAs(UID_A).firestore();
    await assertSucceeds(db.doc(`wagers/${WAGER_ID}`).get());
  });

  it('unauthenticated user cannot read a wager doc', async () => {
    await seedWager();
    const db = unauthed().firestore();
    await assertFails(db.doc(`wagers/${WAGER_ID}`).get());
  });

  it('no client can write a wager doc', async () => {
    const db = authAs(UID_A).firestore();
    await assertFails(db.doc(`wagers/${WAGER_ID}`).set({ prompt: 'hacked' }));
  });
});

// ─── /wagers/{wagerId}/private/answer ────────────────────────────────────────

describe('/wagers/{wagerId}/private/answer', () => {
  it('user who has NOT submitted cannot read the answer doc', async () => {
    await seedWager();
    await seedAnswerDoc();
    const db = authAs(UID_A).firestore();
    await assertFails(db.doc(`wagers/${WAGER_ID}/private/answer`).get());
  });

  it('user who HAS submitted can read the answer doc', async () => {
    await seedWager();
    await seedAnswerDoc();
    await seedSubmission(UID_A);
    const db = authAs(UID_A).firestore();
    await assertSucceeds(db.doc(`wagers/${WAGER_ID}/private/answer`).get());
  });

  // NO-PEEKING property: a placeholder submission (score=0) still satisfies the
  // exists() gate and unlocks the answer doc. This is by design — the placeholder
  // is the user's committed guess; the answer is revealed in step 2 of the submit flow.
  it('user with a placeholder submission (score=0) can read the answer doc [no-peeking-placeholder]', async () => {
    await seedWager();
    await seedAnswerDoc();
    await seedPlaceholderSubmission(UID_A);
    const db = authAs(UID_A).firestore();
    await assertSucceeds(db.doc(`wagers/${WAGER_ID}/private/answer`).get());
  });

  it('no client can write the answer doc', async () => {
    const db = authAs(UID_A).firestore();
    await assertFails(
      db.doc(`wagers/${WAGER_ID}/private/answer`).set({ trueAnswer: 99 }),
    );
  });
});

// ─── /wagers/{wagerId}/submissions/{uid} ─────────────────────────────────────

describe('/wagers/{wagerId}/submissions/{uid}', () => {
  it('create succeeds with correct shape when no prior submission exists', async () => {
    await seedWager();
    const db = authAs(UID_A).firestore();
    await assertSucceeds(
      db.doc(`wagers/${WAGER_ID}/submissions/${UID_A}`).set(validSubmission(UID_A)),
    );
  });

  it('second write to same submission path is rejected (one-shot)', async () => {
    await seedWager();
    const db = authAs(UID_A).firestore();
    // First set = create (doc does not exist) — should succeed
    await assertSucceeds(
      db.doc(`wagers/${WAGER_ID}/submissions/${UID_A}`).set(validSubmission(UID_A)),
    );
    // Second set = update (doc already exists); rejected because resource.data.score=99 != 0
    await assertFails(
      db.doc(`wagers/${WAGER_ID}/submissions/${UID_A}`).set(validSubmission(UID_A)),
    );
  });

  it('full set() on a placeholder submission is rejected (must use partial update)', async () => {
    // The score-patch must use update(), not set(). A set() on an existing doc
    // changes all fields and fails the affectedKeys() hasOnly check.
    await seedWager();
    await seedPlaceholderSubmission(UID_A);
    const db = authAs(UID_A).firestore();
    await assertFails(
      db.doc(`wagers/${WAGER_ID}/submissions/${UID_A}`).set({
        ...placeholderSubmission(UID_A),
        score: 72,
        logError: 0.28,
      }),
    );
  });

  it('create with a missing key is rejected', async () => {
    await seedWager();
    const db = authAs(UID_A).firestore();
    // Missing 'logError' — keys().hasOnly([...]) fails
    await assertFails(
      db.doc(`wagers/${WAGER_ID}/submissions/${UID_A}`).set({
        uid: UID_A,
        guess: 50.7,
        score: 99,
        submittedAt: new Date(),
      }),
    );
  });

  it('create with an extra key is rejected', async () => {
    await seedWager();
    const db = authAs(UID_A).firestore();
    await assertFails(
      db.doc(`wagers/${WAGER_ID}/submissions/${UID_A}`).set({
        ...validSubmission(UID_A),
        foo: 'cheat',
      }),
    );
  });

  it('create with uid field not matching auth uid is rejected', async () => {
    await seedWager();
    // UID_A is authenticated but tries to write to UID_B's doc path
    const db = authAs(UID_A).firestore();
    await assertFails(
      db.doc(`wagers/${WAGER_ID}/submissions/${UID_B}`).set(validSubmission(UID_B)),
    );
  });

  it('create with non-number guess is rejected', async () => {
    await seedWager();
    const db = authAs(UID_A).firestore();
    await assertFails(
      db.doc(`wagers/${WAGER_ID}/submissions/${UID_A}`).set({
        uid: UID_A,
        guess: '50.7', // string, not number
        logError: 0.012,
        score: 99,
        submittedAt: new Date(),
      }),
    );
  });

  it('rejects update once score is patched (non-placeholder state)', async () => {
    await seedWager();
    // validSubmission has score: 99 — not a placeholder.
    await seedSubmission(UID_A);
    const db = authAs(UID_A).firestore();
    await assertFails(
      db.doc(`wagers/${WAGER_ID}/submissions/${UID_A}`).update({ score: 100, logError: 0 }),
    );
  });

  it('allows score+logError patch from placeholder state (score=0, logError=0)', async () => {
    await seedWager();
    await seedPlaceholderSubmission(UID_A);
    const db = authAs(UID_A).firestore();
    await assertSucceeds(
      db.doc(`wagers/${WAGER_ID}/submissions/${UID_A}`).update({
        score: 72,
        logError: 0.28,
      }),
    );
  });

  it('rejects score+logError patch if logError is non-zero (already patched sentinel)', async () => {
    // Seed a submission whose logError is already 9999 (Infinity sentinel) and score is 0.
    await seedWager();
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx
        .firestore()
        .doc(`wagers/${WAGER_ID}/submissions/${UID_A}`)
        .set({ uid: UID_A, guess: 50.7, logError: 9999, score: 0, submittedAt: new Date() });
    });
    const db = authAs(UID_A).firestore();
    await assertFails(
      db.doc(`wagers/${WAGER_ID}/submissions/${UID_A}`).update({ score: 0, logError: 9999 }),
    );
  });

  it('rejects update of guess field (immutable commitment)', async () => {
    await seedWager();
    await seedPlaceholderSubmission(UID_A);
    const db = authAs(UID_A).firestore();
    await assertFails(
      db.doc(`wagers/${WAGER_ID}/submissions/${UID_A}`).update({
        guess: 99.9,
        score: 72,
        logError: 0.28,
      }),
    );
  });

  it('rejects update of submittedAt field', async () => {
    await seedWager();
    await seedPlaceholderSubmission(UID_A);
    const db = authAs(UID_A).firestore();
    await assertFails(
      db.doc(`wagers/${WAGER_ID}/submissions/${UID_A}`).update({
        score: 72,
        logError: 0.28,
        submittedAt: new Date(),
      }),
    );
  });

  it('rejects update with extra fields beyond score+logError', async () => {
    await seedWager();
    await seedPlaceholderSubmission(UID_A);
    const db = authAs(UID_A).firestore();
    await assertFails(
      db.doc(`wagers/${WAGER_ID}/submissions/${UID_A}`).update({
        score: 72,
        logError: 0.28,
        cheating: 'yes',
      }),
    );
  });

  it("another user cannot update someone else's submission", async () => {
    await seedWager();
    await seedPlaceholderSubmission(UID_A);
    const db = authAs(UID_B).firestore();
    await assertFails(
      db.doc(`wagers/${WAGER_ID}/submissions/${UID_A}`).update({ score: 72, logError: 0.28 }),
    );
  });

  it('delete is rejected', async () => {
    await seedWager();
    await seedSubmission(UID_A);
    const db = authAs(UID_A).firestore();
    await assertFails(db.doc(`wagers/${WAGER_ID}/submissions/${UID_A}`).delete());
  });

  it("user who has NOT submitted cannot read another user's submission", async () => {
    await seedWager();
    await seedSubmission(UID_B);
    // UID_A has not submitted — exists() check fails
    const db = authAs(UID_A).firestore();
    await assertFails(db.doc(`wagers/${WAGER_ID}/submissions/${UID_B}`).get());
  });

  it("user who HAS submitted can read another user's submission", async () => {
    await seedWager();
    await seedSubmission(UID_A);
    await seedSubmission(UID_B);
    const db = authAs(UID_A).firestore();
    await assertSucceeds(db.doc(`wagers/${WAGER_ID}/submissions/${UID_B}`).get());
  });

  it('user can always read their OWN submission doc, even when it does not yet exist (duplicate-check before create)', async () => {
    // Regression: the prior rule required exists() for ALL submission reads,
    // including own-doc. That broke submitWager's pre-create duplicate guard
    // because reading own doc returned PermissionDenied for first-time submitters.
    await seedWager();
    const db = authAs(UID_A).firestore();
    await assertSucceeds(db.doc(`wagers/${WAGER_ID}/submissions/${UID_A}`).get());
  });

  it('user can read their own submission once it exists, without needing the exists() gate', async () => {
    await seedWager();
    await seedSubmission(UID_A);
    const db = authAs(UID_A).firestore();
    await assertSucceeds(db.doc(`wagers/${WAGER_ID}/submissions/${UID_A}`).get());
  });
});

// ─── /users/{uid}/wagerStats/{statDoc} ───────────────────────────────────────

describe('/users/{uid}/wagerStats/{statDoc}', () => {
  it('owner can read their own wager stats', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`users/${UID_A}/wagerStats/summary`).set({
        totalSubmitted: 1,
        averageScore: 99,
        averageLogError: 0.012,
        last10Scores: [99],
      });
    });
    const db = authAs(UID_A).firestore();
    await assertSucceeds(db.doc(`users/${UID_A}/wagerStats/summary`).get());
  });

  it("another user cannot read someone else's wager stats", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc(`users/${UID_A}/wagerStats/summary`).set({
        totalSubmitted: 1,
        averageScore: 99,
        averageLogError: 0.012,
        last10Scores: [99],
      });
    });
    const db = authAs(UID_B).firestore();
    await assertFails(db.doc(`users/${UID_A}/wagerStats/summary`).get());
  });

  it('owner can write their own wager stats', async () => {
    const db = authAs(UID_A).firestore();
    await assertSucceeds(
      db.doc(`users/${UID_A}/wagerStats/summary`).set({
        totalSubmitted: 1,
        averageScore: 99,
        averageLogError: 0.012,
        last10Scores: [99],
      }),
    );
  });

  it("another user cannot write someone else's wager stats", async () => {
    const db = authAs(UID_B).firestore();
    await assertFails(
      db.doc(`users/${UID_A}/wagerStats/summary`).set({
        totalSubmitted: 1,
        averageScore: 99,
        averageLogError: 0.012,
        last10Scores: [99],
      }),
    );
  });
});
