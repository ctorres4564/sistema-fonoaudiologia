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

  // Chave de API do DeepSeek
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return response.status(500).json({ error: 'DEEPSEEK_API_KEY is not configured on Vercel.' })
  }

  try {
    const url = 'https://api.deepseek.com/chat/completions'

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
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.7,
        stream: false,
      }),
    })

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      return response.status(apiResponse.status).json({ error: `DeepSeek API error: ${errorText}` })
    }

    const data = await apiResponse.json()
    const resultText = data?.choices?.[0]?.message?.content || ''

    return response.status(200).json({ text: resultText })
  } catch (error) {
    console.error('Error calling DeepSeek API:', error)
    return response.status(500).json({ error: 'Internal Server Error' })
  }
}
