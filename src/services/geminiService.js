/**
 * Faz uma requisição para a rota de API Serverless que se integra ao Google Gemini.
 * @param {string} prompt - Prompt de instrução principal.
 * @param {string} [systemInstruction] - Instrução do sistema para definir persona e escopo da IA.
 * @returns {Promise<string>}
 */
export async function askGemini(prompt, systemInstruction) {
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

    return data.text
  } catch (error) {
    console.error('Error in askGemini service:', error)
    throw error
  }
}
