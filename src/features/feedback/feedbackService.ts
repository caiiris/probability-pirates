/**
 * Bug reports + general feedback.
 *
 * Submissions are appended to a top-level `/feedback/{autoId}` collection
 * (create-only from clients; nobody can read/edit/delete via rules — the owner
 * reviews them in the Firebase console). No Cloud Functions on the Spark plan,
 * so this is the lightest durable inbox we can offer in-app.
 */

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type FeedbackType = 'bug' | 'feedback';

export const FEEDBACK_MESSAGE_MAX = 2000;

export async function submitFeedback(params: {
  uid: string;
  username: string;
  type: FeedbackType;
  message: string;
  route: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const message = params.message.trim();
  if (!message) return { ok: false, error: 'Please write a short message first.' };

  try {
    await addDoc(collection(db, 'feedback'), {
      uid: params.uid,
      username: (params.username ?? '').slice(0, 30),
      type: params.type,
      message: message.slice(0, FEEDBACK_MESSAGE_MAX),
      route: (params.route ?? '').slice(0, 200),
      userAgent: (typeof navigator !== 'undefined' ? navigator.userAgent : '').slice(0, 500),
      createdAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (err) {
    console.error('[submitFeedback]', err);
    return { ok: false, error: 'We could not send that just now. Try again in a moment.' };
  }
}
