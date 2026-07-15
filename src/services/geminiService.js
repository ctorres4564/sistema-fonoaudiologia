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

  return data.text
}
