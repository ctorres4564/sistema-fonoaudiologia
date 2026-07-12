import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

const AUDIT_COLLECTION = 'auditLogs'

export async function logAuditEvent({
  uid,
  action,
  resourceType,
  resourceId,
  result,
  reason = null,
  metadata = null,
}) {
  try {
    await addDoc(collection(db, AUDIT_COLLECTION), {
      uid,
      action,
      resourceType,
      resourceId,
      result,
      reason,
      metadata,
      timestamp: serverTimestamp(),
      userAgent: (navigator?.userAgent || '').substring(0, 200),
    })
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error)
  }
}
