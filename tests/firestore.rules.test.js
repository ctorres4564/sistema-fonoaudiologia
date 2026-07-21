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

describe('audit logs', () => {
  it('impede leitura, criação, alteração e exclusão pelo cliente', async () => {
    await seed('auditLogs/event-1', { actorId: 'professional-a', action: 'record.viewed' })
    const db = firestoreFor('professional-a')
    const eventRef = doc(db, 'auditLogs/event-1')

    await assertFails(getDoc(eventRef))
    await assertFails(setDoc(doc(db, 'auditLogs/event-2'), { actorId: 'professional-a' }))
    await assertFails(updateDoc(eventRef, { action: 'record.exported' }))
    await assertFails(deleteDoc(eventRef))
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

describe('evolution revision history', () => {
  beforeEach(async () => {
    await seed('patients/patient-a', { name: 'Paciente A', userId: 'professional-a' })
    await seed('patients/patient-a/evolutions/evolution-1', { date: '2026-07-16', notes: 'Versão atual' })
  })

  it('permite ao proprietário criar e ler uma versão anterior imutável', async () => {
    const db = firestoreFor('professional-a')
    const revisionRef = doc(db, 'patients/patient-a/evolutions/evolution-1/revisions/revision-1')

    await assertSucceeds(setDoc(revisionRef, { notes: 'Versão anterior', reason: 'Correção clínica' }))
    await assertSucceeds(getDoc(revisionRef))
    await assertFails(updateDoc(revisionRef, { notes: 'Tentativa de alteração' }))
    await assertFails(deleteDoc(revisionRef))
  })

  it('impede outro profissional de acessar o histórico de retificações', async () => {
    const db = firestoreFor('professional-b')
    const revisionRef = doc(db, 'patients/patient-a/evolutions/evolution-1/revisions/revision-1')

    await assertFails(setDoc(revisionRef, { notes: 'Versão anterior', reason: 'Correção clínica' }))
    await assertFails(getDoc(revisionRef))
  })
})

describe('progress analyses', () => {
  beforeEach(async () => {
    await seed('patients/patient-a', { name: 'Paciente A', userId: 'professional-a' })
  })

  it('permite ao proprietário salvar e editar pareceres do paciente', async () => {
    const db = firestoreFor('professional-a')
    const analysisRef = doc(db, 'patients/patient-a/progressAnalyses/analysis-1')
    await assertSucceeds(setDoc(analysisRef, { text: 'Parecer revisado' }))
    await assertSucceeds(updateDoc(analysisRef, { text: 'Parecer atualizado' }))
    await assertSucceeds(getDoc(analysisRef))
  })

  it('impede outro profissional de acessar os pareceres', async () => {
    const db = firestoreFor('professional-b')
    const analysisRef = doc(db, 'patients/patient-a/progressAnalyses/analysis-1')
    await assertFails(setDoc(analysisRef, { text: 'Acesso indevido' }))
    await assertFails(getDoc(analysisRef))
  })
})

describe('evolution drafts', () => {
  beforeEach(async () => {
    await seed('patients/patient-a', { name: 'Paciente A', userId: 'professional-a' })
  })

  it('permite ao proprietário salvar e editar rascunhos de evolução', async () => {
    const db = firestoreFor('professional-a')
    const draftRef = doc(db, 'patients/patient-a/evolutionDrafts/draft-1')
    await assertSucceeds(setDoc(draftRef, { notes: 'Evolução em revisão' }))
    await assertSucceeds(updateDoc(draftRef, { notes: 'Evolução revisada' }))
    await assertSucceeds(getDoc(draftRef))
  })

  it('impede outro profissional de acessar rascunhos de evolução', async () => {
    const db = firestoreFor('professional-b')
    const draftRef = doc(db, 'patients/patient-a/evolutionDrafts/draft-1')
    await assertFails(setDoc(draftRef, { notes: 'Acesso indevido' }))
    await assertFails(getDoc(draftRef))
  })
})

describe('therapeutic plans', () => {
  beforeEach(async () => {
    await seed('patients/patient-a', { name: 'Paciente A', userId: 'professional-a' })
  })

  it('permite ao proprietário criar, editar e consultar o plano terapêutico', async () => {
    const db = firestoreFor('professional-a')
    const planRef = doc(db, 'patients/patient-a/therapeuticPlan/current')

    await assertSucceeds(setDoc(planRef, { status: 'Ativo', objectives: [] }))
    await assertSucceeds(updateDoc(planRef, { generalObjective: 'Ampliar comunicação funcional' }))
    await assertSucceeds(getDoc(planRef))
  })

  it('impede outro profissional de acessar o plano terapêutico', async () => {
    const db = firestoreFor('professional-b')
    const planRef = doc(db, 'patients/patient-a/therapeuticPlan/current')

    await assertFails(setDoc(planRef, { status: 'Ativo', objectives: [] }))
    await assertFails(getDoc(planRef))
  })
})

describe('schedule status history', () => {
  beforeEach(async () => {
    await seed('schedules/schedule-1', { patientId: 'patient-a', userId: 'professional-a', status: 'Agendado' })
  })

  it('permite ao proprietário criar e ler eventos imutáveis de status', async () => {
    const db = firestoreFor('professional-a')
    const historyRef = doc(db, 'schedules/schedule-1/statusHistory/history-1')
    await assertSucceeds(setDoc(historyRef, { previousStatus: 'Agendado', status: 'Confirmado' }))
    await assertSucceeds(getDoc(historyRef))
    await assertFails(updateDoc(historyRef, { status: 'Falta' }))
    await assertFails(deleteDoc(historyRef))
  })

  it('impede outro profissional de acessar o histórico de status', async () => {
    const db = firestoreFor('professional-b')
    const historyRef = doc(db, 'schedules/schedule-1/statusHistory/history-1')
    await assertFails(setDoc(historyRef, { status: 'Confirmado' }))
    await assertFails(getDoc(historyRef))
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

  it('impede autoativação da feature evolutionQualityReview no create', async () => {
    const db = firestoreFor('professional-a')
    await assertFails(setDoc(doc(db, 'users', 'professional-a'), {
      uid: 'professional-a',
      name: 'Profissional A',
      email: 'professional-a@example.com',
      plan: 'demo',
      createdAt: '2026-07-15T00:00:00.000Z',
      features: { evolutionQualityReview: true }
    }))
  })

  it('impede autoativação da feature evolutionQualityReview no update parcial', async () => {
    await seed('users/professional-a', {
      uid: 'professional-a',
      name: 'Profissional A',
      email: 'professional-a@example.com',
      plan: 'demo',
      createdAt: '2026-07-15T00:00:00.000Z',
      features: { evolutionQualityReview: false }
    })
    const db = firestoreFor('professional-a')
    const userRef = doc(db, 'users', 'professional-a')
    await assertFails(updateDoc(userRef, { "features.evolutionQualityReview": true }))
  })

  it('impede autoativação da feature evolutionQualityReview ao substituir o objeto features', async () => {
    await seed('users/professional-a', {
      uid: 'professional-a',
      name: 'Profissional A',
      email: 'professional-a@example.com',
      plan: 'demo',
      createdAt: '2026-07-15T00:00:00.000Z',
      features: { evolutionQualityReview: false }
    })
    const db = firestoreFor('professional-a')
    const userRef = doc(db, 'users', 'professional-a')
    await assertFails(updateDoc(userRef, { features: { evolutionQualityReview: true } }))
  })

  it('permite atualizar outros campos de features sem alterar a flag protegida', async () => {
    await seed('users/professional-a', {
      uid: 'professional-a',
      name: 'Profissional A',
      email: 'professional-a@example.com',
      plan: 'demo',
      createdAt: '2026-07-15T00:00:00.000Z',
      features: { evolutionQualityReview: false, otherFeature: true }
    })
    const db = firestoreFor('professional-a')
    const userRef = doc(db, 'users', 'professional-a')
    await assertSucceeds(updateDoc(userRef, { "features.otherFeature": false }))
  })

  it('impede outro profissional de alterar features', async () => {
    await seed('users/professional-a', {
      uid: 'professional-a',
      name: 'Profissional A',
      email: 'professional-a@example.com',
      plan: 'demo',
      createdAt: '2026-07-15T00:00:00.000Z',
      features: { evolutionQualityReview: false }
    })
    const otherDb = firestoreFor('professional-b')
    const userRef = doc(otherDb, 'users', 'professional-a')
    await assertFails(updateDoc(userRef, { "features.evolutionQualityReview": true }))
  })

  it('impede desativação de true para false pelo cliente', async () => {
    await seed('users/professional-a', {
      uid: 'professional-a',
      name: 'Profissional A',
      email: 'professional-a@example.com',
      plan: 'demo',
      createdAt: '2026-07-15T00:00:00.000Z',
      features: { evolutionQualityReview: true }
    })
    const db = firestoreFor('professional-a')
    const userRef = doc(db, 'users', 'professional-a')
    await assertFails(updateDoc(userRef, { "features.evolutionQualityReview": false }))
  })

  it('impede desativação por substituição estrutural de true para false pelo cliente', async () => {
    await seed('users/professional-a', {
      uid: 'professional-a',
      name: 'Profissional A',
      email: 'professional-a@example.com',
      plan: 'demo',
      createdAt: '2026-07-15T00:00:00.000Z',
      features: { evolutionQualityReview: true }
    })
    const db = firestoreFor('professional-a')
    const userRef = doc(db, 'users', 'professional-a')
    await assertFails(updateDoc(userRef, { features: { evolutionQualityReview: false } }))
  })

  it('impede remoção do campo evolutionQualityReview pelo cliente', async () => {
    await seed('users/professional-a', {
      uid: 'professional-a',
      name: 'Profissional A',
      email: 'professional-a@example.com',
      plan: 'demo',
      createdAt: '2026-07-15T00:00:00.000Z',
      features: { evolutionQualityReview: true }
    })
    const db = firestoreFor('professional-a')
    const userRef = doc(db, 'users', 'professional-a')
    // Substituindo o objeto features por um sem a flag
    await assertFails(updateDoc(userRef, { features: { otherFeature: true } }))
  })

  it('impede remoção do objeto features inteiro pelo cliente', async () => {
    await seed('users/professional-a', {
      uid: 'professional-a',
      name: 'Profissional A',
      email: 'professional-a@example.com',
      plan: 'demo',
      createdAt: '2026-07-15T00:00:00.000Z',
      features: { evolutionQualityReview: true }
    })
    const db = firestoreFor('professional-a')
    const userRef = doc(db, 'users', 'professional-a')
    // Deletar o campo features inteiro
    await assertFails(updateDoc(userRef, { features: null }))
  })

  it('impede criar o perfil com features definido como false ou null e depois elevar para true', async () => {
    const db = firestoreFor('professional-a')
    const userRef = doc(db, 'users', 'professional-a')
    await assertSucceeds(setDoc(userRef, {
      uid: 'professional-a',
      name: 'Profissional A',
      email: 'professional-a@example.com',
      plan: 'demo',
      createdAt: '2026-07-15T00:00:00.000Z',
      features: { evolutionQualityReview: false }
    }))
    await assertFails(updateDoc(userRef, { "features.evolutionQualityReview": true }))
  })
})

describe('backend-only collections', () => {
  it('impede o cliente de ler ou escrever contadores de IA', async () => {
    const db = firestoreFor('professional-a')
    const usageRef = doc(db, 'aiUsage', 'professional-a_2026-07')

    await assertFails(getDoc(usageRef))
    await assertFails(setDoc(usageRef, { uid: 'professional-a', count: 0 }))
  })

  it('impede o cliente de escrever na coleção de idempotência', async () => {
    const db = firestoreFor('professional-a')
    const opRef = doc(db, 'evolutionFinalizeOperations', 'op-1')
    await assertFails(getDoc(opRef))
    await assertFails(setDoc(opRef, { uid: 'professional-a', status: 'created' }))
  })

  it('impede o cliente de escrever na coleção de rate limit', async () => {
    const db = firestoreFor('professional-a')
    const limitRef = doc(db, 'evolutionFinalizeRateLimits', 'limit-1')
    await assertFails(getDoc(limitRef))
    await assertFails(setDoc(limitRef, { uid: 'professional-a', count: 1 }))
  })

  it('impede o cliente de escrever ou apagar registros de quality reviews', async () => {
    const db = firestoreFor('professional-a')
    const reviewRef = doc(db, 'patients/patient-a/evolutions/evolution-1/qualityReviews/revision-1')
    await assertFails(setDoc(reviewRef, { finalAlerts: [] }))
    await assertFails(deleteDoc(reviewRef))
  })
})
