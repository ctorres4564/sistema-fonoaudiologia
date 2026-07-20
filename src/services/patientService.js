import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  runTransaction,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { applyObjectiveProgress } from './therapeuticPlanService'
import { recordAuditEvent } from './auditService'

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

export async function createPatient(payload) {
  const patientRef = await addDoc(patientsCollection, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  await recordAuditEvent({ action: 'patient.created', patientId: patientRef.id, resourceId: patientRef.id, changedFields: Object.keys(payload).filter((key) => key !== 'userId') })
  return patientRef
}

export async function updatePatient(patientId, payload) {
  await updateDoc(doc(db, 'patients', patientId), {
    ...payload,
    updatedAt: serverTimestamp(),
  })
  await recordAuditEvent({ action: 'patient.updated', patientId, resourceId: patientId, changedFields: Object.keys(payload).filter((key) => key !== 'userId') })
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

export async function getEvolutionRevisions(patientId, evolutionId) {
  const revisionsQuery = query(
    collection(db, 'patients', patientId, 'evolutions', evolutionId, 'revisions'),
    orderBy('revisedAt', 'desc'),
  )
  const snapshot = await getDocs(revisionsQuery)
  return snapshot.docs.map((revisionDoc) => ({ id: revisionDoc.id, ...revisionDoc.data() }))
}

export async function reviseEvolution(patientId, evolutionId, nextValues, reason) {
  const evolutionRef = doc(db, 'patients', patientId, 'evolutions', evolutionId)
  const revisionRef = doc(collection(evolutionRef, 'revisions'))

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(evolutionRef)
    if (!snapshot.exists()) throw new Error('Evolução não encontrada.')

    const current = snapshot.data()
    transaction.set(revisionRef, {
      date: current.date || '',
      duration: Number(current.duration) || 0,
      notes: current.notes || '',
      reason,
      revisedAt: serverTimestamp(),
    })
    transaction.update(evolutionRef, {
      date: nextValues.date,
      duration: Number(nextValues.duration) || 0,
      notes: nextValues.notes,
      revisedAt: serverTimestamp(),
      revisionCount: (Number(current.revisionCount) || 0) + 1,
    })
  })
  await recordAuditEvent({ action: 'evolution.revised', patientId, resourceId: evolutionId, changedFields: ['date', 'duration', 'notes', 'reason'] })
}

export function subscribeProgressAnalyses(patientId, callback, onError) {
  const analysesCollection = collection(db, 'patients', patientId, 'progressAnalyses')
  return onSnapshot(
    analysesCollection,
    (snapshot) => {
      const analyses = snapshot.docs
        .map((analysisDoc) => ({ id: analysisDoc.id, ...analysisDoc.data() }))
        .sort((a, b) => (b.updatedAt?.seconds || b.createdAt?.seconds || 0) - (a.updatedAt?.seconds || a.createdAt?.seconds || 0))
      callback(analyses)
    },
    onError,
  )
}

export async function saveProgressAnalysis(patientId, text, analysisId = '') {
  if (analysisId) {
    await updateDoc(doc(db, 'patients', patientId, 'progressAnalyses', analysisId), {
      text,
      updatedAt: serverTimestamp(),
    })
    return analysisId
  }

  const analysisRef = await addDoc(collection(db, 'patients', patientId, 'progressAnalyses'), {
    text,
    source: 'IA',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return analysisRef.id
}

export function subscribeEvolutionDrafts(patientId, callback, onError) {
  return onSnapshot(
    collection(db, 'patients', patientId, 'evolutionDrafts'),
    (snapshot) => {
      const drafts = snapshot.docs
        .map((draftDoc) => ({ id: draftDoc.id, ...draftDoc.data() }))
        .sort((a, b) => (b.updatedAt?.seconds || b.createdAt?.seconds || 0) - (a.updatedAt?.seconds || a.createdAt?.seconds || 0))
      callback(drafts)
    },
    onError,
  )
}

export async function saveEvolutionDraft(patientId, values, draftId = '') {
  const payload = {
    date: values.date,
    duration: Number(values.duration) || 0,
    notes: values.notes,
    updatedAt: serverTimestamp(),
  }
  if (draftId) {
    await updateDoc(doc(db, 'patients', patientId, 'evolutionDrafts', draftId), payload)
    return draftId
  }
  const draftRef = await addDoc(collection(db, 'patients', patientId, 'evolutionDrafts'), {
    ...payload,
    createdAt: serverTimestamp(),
  })
  return draftRef.id
}

export async function completeScheduledEvolution(patientId, scheduleId, payload) {
  const patientRef = doc(db, 'patients', patientId)
  const scheduleRef = doc(db, 'schedules', scheduleId)
  const evolutionRef = doc(collection(db, 'patients', patientId, 'evolutions'))
  const planRef = doc(db, 'patients', patientId, 'therapeuticPlan', 'current')

  await runTransaction(db, async (transaction) => {
    const [patientSnapshot, scheduleSnapshot, planSnapshot] = await Promise.all([
      transaction.get(patientRef),
      transaction.get(scheduleRef),
      transaction.get(planRef),
    ])

    if (!patientSnapshot.exists()) throw new Error('Paciente não encontrado.')
    if (!scheduleSnapshot.exists()) throw new Error('Agendamento não encontrado.')

    const schedule = scheduleSnapshot.data()
    if (schedule.patientId !== patientId) throw new Error('Agendamento não pertence ao paciente.')
    if (schedule.status === 'Realizado' || schedule.evolutionId) {
      const error = new Error('Este atendimento já foi registrado.')
      error.code = 'schedule/already-completed'
      throw error
    }

    const patient = patientSnapshot.data()
    const nextCompleted = (Number(patient.completedSessions) || 0) + 1
    const remaining = Math.max((Number(patient.totalSessions) || 0) - nextCompleted, 0)

    transaction.set(evolutionRef, {
      ...payload,
      scheduleId,
      createdAt: serverTimestamp(),
    })
    transaction.update(patientRef, {
      completedSessions: nextCompleted,
      remainingSessions: remaining,
      status: remaining > 0 ? 'Ativo' : 'Finalizado',
      updatedAt: serverTimestamp(),
    })
    transaction.update(scheduleRef, {
      status: 'Realizado',
      evolutionId: evolutionRef.id,
      sessionDeducted: true,
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    if (planSnapshot.exists() && payload.objectiveProgress?.length > 0) {
      const objectives = applyObjectiveProgress(planSnapshot.data().objectives, payload.objectiveProgress)
      transaction.update(planRef, { objectives, updatedAt: serverTimestamp() })
      transaction.update(patientRef, {
        therapeuticAchievedCount: objectives.filter((objective) => objective.status === 'Atingido').length,
      })
    }
  })

  await recordAuditEvent({ action: 'evolution.created', patientId, resourceId: evolutionRef.id, changedFields: Object.keys(payload) })

  return evolutionRef.id
}

export async function createClinicalEvolution(patientId, payload, incrementSession = true) {
  const patientRef = doc(db, 'patients', patientId)
  const planRef = doc(db, 'patients', patientId, 'therapeuticPlan', 'current')
  const evolutionRef = doc(collection(db, 'patients', patientId, 'evolutions'))

  await runTransaction(db, async (transaction) => {
    const [patientSnapshot, planSnapshot] = await Promise.all([
      transaction.get(patientRef),
      transaction.get(planRef),
    ])
    if (!patientSnapshot.exists()) throw new Error('Paciente não encontrado.')

    transaction.set(evolutionRef, { ...payload, createdAt: serverTimestamp() })
    const patientUpdates = { updatedAt: serverTimestamp() }
    if (incrementSession) {
      const patient = patientSnapshot.data()
      const completedSessions = (Number(patient.completedSessions) || 0) + 1
      const remainingSessions = Math.max((Number(patient.totalSessions) || 0) - completedSessions, 0)
      Object.assign(patientUpdates, {
        completedSessions,
        remainingSessions,
        status: remainingSessions > 0 ? 'Ativo' : 'Finalizado',
      })
    }
    if (planSnapshot.exists() && payload.objectiveProgress?.length > 0) {
      const objectives = applyObjectiveProgress(planSnapshot.data().objectives, payload.objectiveProgress)
      transaction.update(planRef, { objectives, updatedAt: serverTimestamp() })
      patientUpdates.therapeuticAchievedCount = objectives.filter((objective) => objective.status === 'Atingido').length
    }
    transaction.update(patientRef, patientUpdates)
  })

  await recordAuditEvent({ action: 'evolution.created', patientId, resourceId: evolutionRef.id, changedFields: Object.keys(payload) })

  return evolutionRef.id
}
