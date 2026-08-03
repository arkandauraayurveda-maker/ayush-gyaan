import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// चेक करें कि ऐप पहले से इनिशियलाइज़ तो नहीं है 
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') as string,
    }),
  });
}

// यह adminAuth ही हमारे backend में टोकन वेरीफाई करेगा
export const adminAuth = getAuth();