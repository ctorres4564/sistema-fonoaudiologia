import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { readFileSync } from 'node:fs'

const projectId = 'demo-fonoflow'
let testEnv

function firestoreFor(uid) {
  return testEnv.authenticatedContext(uid, { email: `${uid}@example.com` }).firestore()
}

async function seed(path, data) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data)
  })
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  })
})

beforeEach(async () => {
  await testEnv.clearFirestore()
})

afterAll(async () => {
  await testEnv.cleanup()
})

describe('patients', () => {
  it('permite criar e ler o próprio paciente', async () => {
    const db = firestoreFor('professional-a')
    const patientRef = doc(db, 'patients', 'patient-a')

    await assertSucceeds(setDoc(patientRef, { name: 'Paciente A', userId: 'professional-a' }))
    await assertSucceeds(getDoc(patientRef))
  })

  it('impede acesso ao paciente de outro profissional', async () => {
    await seed('patients/patient-a', { name: 'Paciente A', userId: 'professional-a' })
    const otherDb = firestoreFor('professional-b')

    await assertFails(getDoc(doc(otherDb, 'patients', 'patient-a')))
    await assertFails(deleteDoc(doc(otherDb, 'patients', 'patient-a')))
  })

  it('impede trocar o proprietário de um paciente', async () => {
    await seed('patients/patient-a', { name: 'Paciente A', userId: 'professional-a' })
    const ownerDb = firestoreFor('professional-a')

    await assertFails(updateDoc(doc(ownerDb, 'patients', 'patient-a'), { userId: 'professional-b' }))
  })

  it('impede acesso sem autenticação', async () => {
    await seed('patients/patient-a', { name: 'Paciente A', userId: 'professional-a' })
    const anonymousDb = testEnv.unauthenticatedContext().firestore()

    await assertFails(getDoc(doc(anonymousDb, 'patients', 'patient-a')))
  })
})

describe('documents subcollection', () => {
  beforeEach(async () => {
    await seed('patients/patient-a', { name: 'Paciente A', userId: 'professional-a' })
  })

  it('permite que o proprietário do paciente crie, leia e exclua documentos dele', async () => {
    const db = firestoreFor('professional-a')
    const docRef = doc(db, 'patients/patient-a/documents/doc-1')

    await assertSucceeds(setDoc(docRef, { name: 'laudo.pdf', url: 'https://example.com' }))
    await assertSucceeds(getDoc(docRef))
    await assertSucceeds(deleteDoc(docRef))
  })

  it('impede que outro profissional leia ou escreva documentos no paciente', async () => {
    const db = firestoreFor('professional-b')
    const docRef = doc(db, 'patients/patient-a/documents/doc-1')

    await assertFails(setDoc(docRef, { name: 'laudo.pdf', url: 'https://example.com' }))
    await assertFails(getDoc(docRef))
  })

  it('impede que usuários anônimos leiam ou escrevam documentos', async () => {
    const anonymousDb = testEnv.unauthenticatedContext().firestore()
    const docRef = doc(anonymousDb, 'patients/patient-a/documents/doc-1')

    await assertFails(setDoc(docRef, { name: 'laudo.pdf', url: 'https://example.com' }))
    await assertFails(getDoc(docRef))
  })
})

describe('users', () => {
  it('permite criar somente o próprio perfil no plano demo', async () => {
    const db = firestoreFor('professional-a')

    await assertSucceeds(setDoc(doc(db, 'users', 'professional-a'), {
      uid: 'professional-a',
      name: 'Profissional A',
      email: 'professional-a@example.com',
      plan: 'demo',
      createdAt: '2026-07-15T00:00:00.000Z',
    }))
  })

  it('impede criar perfil premium ou perfil de outro usuário', async () => {
    const db = firestoreFor('professional-a')
    const baseProfile = {
      uid: 'professional-a',
      name: 'Profissional A',
      email: 'professional-a@example.com',
      plan: 'premium',
      createdAt: '2026-07-15T00:00:00.000Z',
    }

    await assertFails(setDoc(doc(db, 'users', 'professional-a'), baseProfile))
    await assertFails(setDoc(doc(db, 'users', 'professional-b'), {
      ...baseProfile,
      uid: 'professional-b',
      plan: 'demo',
    }))
  })

  it('permite editar dados básicos, mas não o plano', async () => {
    await seed('users/professional-a', {
      uid: 'professional-a',
      name: 'Profissional A',
      email: 'professional-a@example.com',
      plan: 'demo',
      createdAt: '2026-07-15T00:00:00.000Z',
    })
    const db = firestoreFor('professional-a')
    const userRef = doc(db, 'users', 'professional-a')

    await assertSucceeds(updateDoc(userRef, { name: 'Novo nome' }))
    await assertFails(updateDoc(userRef, { plan: 'premium' }))
    await assertFails(deleteDoc(userRef))
  })

  it('impede ler o perfil de outro usuário', async () => {
    await seed('users/professional-a', { uid: 'professional-a', plan: 'demo' })
    const otherDb = firestoreFor('professional-b')

    await assertFails(getDoc(doc(otherDb, 'users', 'professional-a')))
  })
})

describe('backend-only collections', () => {
  it('impede o cliente de ler ou escrever contadores de IA', async () => {
    const db = firestoreFor('professional-a')
    const usageRef = doc(db, 'aiUsage', 'professional-a_2026-07')

    await assertFails(getDoc(usageRef))
    await assertFails(setDoc(usageRef, { uid: 'professional-a', count: 0 }))
  })
})
