import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase/config'

const schedulesCollection = collection(db, 'schedules')

export function subscribeSchedules(userId, callback, onError) {
  const q = query(schedulesCollection, where('userId', '==', userId))

  return onSnapshot(
    q,
    (snapshot) => {
      const schedules = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a, b) => {
          // Ordenar por data e horário de início
          const dateTimeA = `${a.date || ''}T${a.startTime || ''}`
          const dateTimeB = `${b.date || ''}T${b.startTime || ''}`
          return dateTimeA.localeCompare(dateTimeB)
        })
      callback(schedules)
    },
    onError,
  )
}

export function createSchedule(payload) {
  return addDoc(schedulesCollection, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export function updateSchedule(scheduleId, payload) {
  return updateDoc(doc(db, 'schedules', scheduleId), {
    ...payload,
    updatedAt: serverTimestamp(),
  })
}

export function removeSchedule(scheduleId) {
  return deleteDoc(doc(db, 'schedules', scheduleId))
}
