import { auth } from '../firebase/config'

/**
 * Faz uma requisição para a rota de API Serverless que se integra ao Google Gemini / OpenRouter.
 * Valida e limita as chamadas de IA do usuário no plano de demonstração.
 * @param {string} prompt - Prompt de instrução principal.
 * @param {string} [systemInstruction] - Instrução do sistema para definir persona e escopo da IA.
 * @returns {Promise<string>}
 */
export async function askGemini(prompt, systemInstruction) {
  const userId = auth.currentUser?.uid || 'anonymous'
  const currentMonth = new Date().toISOString().substring(0, 7) // Formato: YYYY-MM
  const storageKey = `ia_usage_${userId}_${currentMonth}`

  const currentUsage = Number(localStorage.getItem(storageKey)) || 0
  const userPlan = (localStorage.getItem('user_plan') || 'demo').toLowerCase()

  // Trava de cota mensal (limite de 10 chamadas no plano demonstrativo)
  if (userPlan !== 'premium' && currentUsage >= 10) {
    throw new Error('Cota de IA excedida! Você utilizou as 10 requisições mensais gratuitas do plano demonstrativo. Assine o plano comercial para liberar uso ilimitado.')
  }

  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, systemInstruction }),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao obter resposta da Inteligência Artificial.')
    }

    // Incrementar contador de uso após sucesso na requisição
    localStorage.setItem(storageKey, String(currentUsage + 1))

    return data.text
  } catch (error) {
    console.error('Error in askGemini service:', error)
    throw error
  }
}
