import { auth } from '../firebase/config'

const AUTH_ERROR_MESSAGE = 'Sua sessão expirou ou é inválida. Faça login novamente para usar a Inteligência Artificial.'

async function parseResponse(response) {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

/**
 * Faz uma requisição para a rota de API Serverless que se integra ao Google Gemini / OpenRouter.
 * Valida e limita as chamadas de IA do usuário no plano de demonstração.
 * @param {string} prompt - Prompt de instrução principal.
 * @param {string} [systemInstruction] - Instrução do sistema para definir persona e escopo da IA.
 * @returns {Promise<string>}
 */
export async function askGemini(prompt, systemInstruction) {
  const currentUser = auth.currentUser

  if (!currentUser) {
    throw new Error(AUTH_ERROR_MESSAGE)
  }

  const userId = currentUser.uid
  const currentMonth = new Date().toISOString().substring(0, 7) // Formato: YYYY-MM
  const storageKey = `ia_usage_${userId}_${currentMonth}`

  const currentUsage = Number(localStorage.getItem(storageKey)) || 0
  const userPlan = (localStorage.getItem('user_plan') || 'demo').toLowerCase()

  // Trava de cota mensal (limite de 20 chamadas no plano demonstrativo)
  if (userPlan !== 'premium' && currentUsage >= 20) {
    throw new Error('Cota de IA excedida! Você utilizou as 20 requisições mensais gratuitas do plano demonstrativo. Assine o plano comercial para liberar uso ilimitado.')
  }

  const idToken = await currentUser.getIdToken()

  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, systemInstruction }),
  })

  const data = await parseResponse(response)
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(data.error || AUTH_ERROR_MESSAGE)
    }

    throw new Error(data.error || 'Erro ao obter resposta da Inteligência Artificial.')
  }

  // Incrementar contador de uso após sucesso na requisição
  localStorage.setItem(storageKey, String(currentUsage + 1))

  return data.text
}
