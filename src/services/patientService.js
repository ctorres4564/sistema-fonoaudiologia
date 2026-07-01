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

const patientsCollection = collection(db, 'patients')

export function subscribePatients(userId, callback, onError) {
  const q = query(patientsCollection, where('userId', '==', userId))

  return onSnapshot(
    q,
    (snapshot) => {
      const patients = snapshot.docs
        .map((patientDoc) => ({
          id: patientDoc.id,
          ...patientDoc.data(),
        }))
        .sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0
          const bTime = b.createdAt?.seconds || 0
          return bTime - aTime
        })
      callback(patients)
    },
    onError,
  )
}

export function createPatient(payload) {
  return addDoc(patientsCollection, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export function updatePatient(patientId, payload) {
  return updateDoc(doc(db, 'patients', patientId), {
    ...payload,
    updatedAt: serverTimestamp(),
  })
}

export function removePatient(patientId) {
  return deleteDoc(doc(db, 'patients', patientId))
}
