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

export function subscribeEvolutions(patientId, callback, onError) {
  const evolutionsCollection = collection(db, 'patients', patientId, 'evolutions')

  return onSnapshot(
    evolutionsCollection,
    (snapshot) => {
      const evolutions = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a, b) => {
          // Ordenar por data da sessão (decrescente, mais recentes primeiro)
          const dateA = a.date || ''
          const dateB = b.date || ''
          if (dateA !== dateB) {
            return dateB.localeCompare(dateA)
          }
          // Fallback para data de criação
          const aTime = a.createdAt?.seconds || 0
          const bTime = b.createdAt?.seconds || 0
          return bTime - aTime
        })
      callback(evolutions)
    },
    onError,
  )
}

export function createEvolution(patientId, payload) {
  const evolutionsCollection = collection(db, 'patients', patientId, 'evolutions')
  return addDoc(evolutionsCollection, {
    ...payload,
    createdAt: serverTimestamp(),
  })
}

export function removeEvolution(patientId, evolutionId) {
  return deleteDoc(doc(db, 'patients', patientId, 'evolutions', evolutionId))
}
