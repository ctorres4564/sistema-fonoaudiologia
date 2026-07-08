export default async function handler(request, response) {
  // CORS Headers
  response.setHeader('Access-Control-Allow-Credentials', true)
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (request.method === 'OPTIONS') {
    return response.status(200).end()
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const { prompt, systemInstruction } = request.body

  if (!prompt) {
    return response.status(400).json({ error: 'Prompt is required' })
  }

  // Chave de API da OpenRouter
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return response.status(500).json({ error: 'OPENROUTER_API_KEY is not configured on Vercel.' })
  }

  try {
    const url = 'https://openrouter.ai/api/v1/chat/completions'

    const messages = []
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction })
    }
    messages.push({ role: 'user', content: prompt })

    const apiResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://fonoflow.vercel.app',
        'X-Title': 'FonoFlow',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: messages,
        temperature: 0.7,
      }),
    })

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      return response.status(apiResponse.status).json({ error: `OpenRouter API error: ${errorText}` })
    }

    const data = await apiResponse.json()
    const resultText = data?.choices?.[0]?.message?.content || ''

    return response.status(200).json({ text: resultText })
  } catch (error) {
    console.error('Error calling OpenRouter API:', error)
    return response.status(500).json({ error: 'Internal Server Error' })
  }
}
