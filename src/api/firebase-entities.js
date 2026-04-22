import { db } from './firebaseClient';
import {
  collection, doc, getDocs, getDoc,
  addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit,
  serverTimestamp
} from 'firebase/firestore';

const createEntity = (collectionName) => ({
  list: async (order = '-created_date', max = 50) => {
    const field = order.startsWith('-') ? order.slice(1) : order;
    const dir = order.startsWith('-') ? 'desc' : 'asc';
    const q = query(collection(db, collectionName), orderBy(field, dir), limit(max));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

filter: async (filters = {}, order = '-created_date', max = 50) => {
  const filterEntries = Object.entries(filters);
  let q;
  if (filterEntries.length === 0) {
    const field = order.startsWith('-') ? order.slice(1) : order;
    const dir = order.startsWith('-') ? 'desc' : 'asc';
    q = query(collection(db, collectionName), orderBy(field, dir), limit(max));
  } else {
    const conditions = filterEntries.map(([key, value]) => where(key, '==', value));
    q = query(collection(db, collectionName), ...conditions, limit(max));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
},

  create: async (data) => {
    const ref = await addDoc(collection(db, collectionName), {
      ...data,
      created_date: serverTimestamp()
    });
    return { id: ref.id, ...data };
  },

  update: async (id, data) => {
    await updateDoc(doc(db, collectionName, id), data);
    return { id, ...data };
  },

  delete: async (id) => {
    await deleteDoc(doc(db, collectionName, id));
    return { id };
  }
});

export const entities = {
  Unit: createEntity('units'),
  Tenant: createEntity('tenants'),
  Payment: createEntity('payments'),
  Notification: createEntity('notifications'),
  Contract: createEntity('contracts'),
};