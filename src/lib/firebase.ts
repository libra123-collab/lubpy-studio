import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  getDocFromServer,
  doc,
  updateDoc
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  projectId: firebaseConfigData.projectId,
  appId: firebaseConfigData.appId,
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
};

// Initialize Firebase App instance safely (singleton pattern)
export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Cloud Firestore instance
export const db = getFirestore(firebaseApp);

export interface SupportChatMessage {
  id?: string;
  senderId?: string;
  senderName: string;
  senderEmail?: string;
  senderRole?: string;
  senderAvatar?: string;
  message: string;
  category?: string;
  status?: 'unread' | 'open' | 'responded' | 'resolved';
  createdAt: string;
  reply?: string;
  repliedAt?: string;
  clientInfo?: string;
}

const LOCAL_STORAGE_SUPPORT_KEY = 'lubpy_firestore_support_messages_fallback';

export function getLocalSupportMessages(): SupportChatMessage[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SUPPORT_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLocalSupportMessage(msg: SupportChatMessage) {
  try {
    const list = getLocalSupportMessages();
    const updated = [msg, ...list.filter(m => m.id !== msg.id)].slice(0, 50);
    localStorage.setItem(LOCAL_STORAGE_SUPPORT_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving local support message:', e);
  }
}

/**
 * Send a quick support message to the 'support_messages' collection in Firestore.
 */
export async function sendSupportMessageToFirestore(
  data: Omit<SupportChatMessage, 'id' | 'createdAt' | 'status'>
): Promise<{ success: boolean; id?: string; error?: string }> {
  const nowStr = new Date().toISOString();
  const localId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  
  const payload: SupportChatMessage = {
    ...data,
    id: localId,
    status: 'unread',
    createdAt: nowStr,
    category: data.category || 'General Support',
  };

  // Immediate local cache
  saveLocalSupportMessage(payload);

  try {
    const colRef = collection(db, 'support_messages');
    const docRef = await addDoc(colRef, {
      senderId: payload.senderId || 'guest',
      senderName: payload.senderName || 'Khách hàng',
      senderEmail: payload.senderEmail || '',
      senderRole: payload.senderRole || 'client',
      senderAvatar: payload.senderAvatar || '',
      message: payload.message,
      category: payload.category,
      status: payload.status,
      createdAt: payload.createdAt,
      serverTime: serverTimestamp(),
      clientInfo: payload.clientInfo || navigator.userAgent.slice(0, 100),
    });

    return { success: true, id: docRef.id };
  } catch (err: any) {
    console.warn('Firestore write warning (using cached fallback):', err?.message || err);
    // Still return success with local ID so user experience is not disrupted
    return { success: true, id: localId, error: err?.message };
  }
}

/**
 * Real-time listener for support chat messages in Firestore with local fallback
 */
export function subscribeToSupportMessages(
  onMessages: (messages: SupportChatMessage[]) => void,
  userEmail?: string,
  userUid?: string
): () => void {
  try {
    const colRef = collection(db, 'support_messages');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(30));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const remoteMsgs: SupportChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          remoteMsgs.push({
            id: docSnap.id,
            senderId: data.senderId,
            senderName: data.senderName,
            senderEmail: data.senderEmail,
            senderRole: data.senderRole,
            senderAvatar: data.senderAvatar,
            message: data.message,
            category: data.category,
            status: data.status,
            createdAt: data.createdAt,
            reply: data.reply,
            repliedAt: data.repliedAt,
          });
        });

        // Merge with any offline pending items in local cache
        const local = getLocalSupportMessages();
        const mergedMap = new Map<string, SupportChatMessage>();
        
        // Add remote first
        remoteMsgs.forEach(m => {
          if (m.id) mergedMap.set(m.id, m);
        });
        
        // Add local if not already present
        local.forEach(m => {
          if (m.id && !mergedMap.has(m.id)) {
            mergedMap.set(m.id, m);
          }
        });

        const sorted = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        onMessages(sorted);
      },
      (error) => {
        console.warn('Firestore snapshot subscription warning (fallback to local):', error.message);
        // Fallback to local storage
        const local = getLocalSupportMessages().sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        onMessages(local);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Failed to subscribe to Firestore support messages:', err);
    const local = getLocalSupportMessages();
    onMessages(local);
    return () => {};
  }
}

/**
 * CS / Support Agent replies to a support message in Firestore
 */
export async function replyToSupportMessageInFirestore(
  messageId: string,
  replyText: string,
  responderName: string
): Promise<{ success: boolean; error?: string }> {
  // Update local storage fallback
  try {
    const list = getLocalSupportMessages();
    const updated = list.map(m => {
      if (m.id === messageId) {
        return {
          ...m,
          reply: replyText,
          repliedAt: new Date().toISOString(),
          status: 'responded' as const
        };
      }
      return m;
    });
    localStorage.setItem(LOCAL_STORAGE_SUPPORT_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error updating local message cache:', e);
  }

  try {
    const docRef = doc(db, 'support_messages', messageId);
    await updateDoc(docRef, {
      reply: replyText,
      repliedAt: new Date().toISOString(),
      status: 'responded',
      responderName
    });
    return { success: true };
  } catch (err: any) {
    console.warn('Update doc warning (local cached):', err?.message || err);
    return { success: true, error: err?.message };
  }
}

