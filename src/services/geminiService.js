import { auth } from '../firebase/config'

export async function askGemini(prompt, systemInstruction) {
  const user = auth.currentUser
  if (!user) {
    throw new Error('Usuário não autenticado. Faça login para usar a inteligência artificial.')
  }

  const userId = user.uid
  const currentMonth = new Date().toISOString().substring(0, 7)
  const storageKey = `ia_usage_${userId}_${currentMonth}`

  const currentUsage = Number(localStorage.getItem(storageKey)) || 0
  const userPlan = (localStorage.getItem('user_plan') || 'demo').toLowerCase()

  if (userPlan !== 'premium' && currentUsage >= 20) {
    throw new Error('Cota de IA excedida! Você utilizou as 20 requisições mensais gratuitas do plano demonstrativo. Assine o plano comercial para liberar uso ilimitado.')
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

    localStorage.setItem(storageKey, String(currentUsage + 1))

    return stripMarkdown(data.text)
  } catch (error) {
    console.error('Error in askGemini service:', error)
    throw error
  }
}

function stripMarkdown(text) {
  if (!text) return ''
  let result = text
  result = result.replace(/#{1,6}\s+/g, '')
  result = result.replace(/\*{1,3}/g, '')
  result = result.replace(/_{1,2}/g, '')
  result = result.replace(/`{1,3}/g, '')
  result = result.replace(/~~/g, '')
  result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  result = result.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
  result = result.replace(/^[-*+]\s+/gm, '- ')
  result = result.replace(/^\d+\.\s+/gm, '')
  result = result.replace(/^>\s+/gm, '')
  result = result.replace(/---+/g, '')
  return result.trim()
}
