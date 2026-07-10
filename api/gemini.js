export default async function handler(request, response) {
  // CORS Headers
  const allowedOrigins = [
    'https://fonoflow.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  const origin = request.headers.origin;

  if (origin && (allowedOrigins.includes(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin))) {
    response.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    response.setHeader('Access-Control-Allow-Origin', 'https://fonoflow.vercel.app');
  }

  response.setHeader('Access-Control-Allow-Credentials', true)
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

  if (!prompt || typeof prompt !== 'string') {
    return response.status(400).json({ error: 'Prompt is required and must be a string' })
  }

  if (prompt.length > 10000) {
    return response.status(400).json({ error: 'Prompt is too long (maximum 10,000 characters)' })
  }

  // Chaves de API das opções (Prioriza Gemini API direta se configurada, senão usa OpenRouter/DeepSeek)
  const geminiApiKey = process.env.GEMINI_API_KEY
  const openRouterApiKey = process.env.OPENROUTER_API_KEY

  if (!geminiApiKey && !openRouterApiKey) {
    return response.status(500).json({ error: 'Nenhuma chave de API (GEMINI_API_KEY ou OPENROUTER_API_KEY) está configurada.' })
  }

  try {
    let resultText = ''

    if (geminiApiKey) {
      // Chamada direta para a API oficial do Google Gemini 1.5 Flash
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`
      
      const payload = {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      }

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }]
        }
      }

      const apiResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text()
        return response.status(apiResponse.status).json({ error: `Gemini API error: ${errorText}` })
      }

      const data = await apiResponse.json()
      resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    } else {
      // Fallback para OpenRouter / DeepSeek se apenas esta estiver configurada
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
          'Authorization': `Bearer ${openRouterApiKey}`,
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
      resultText = data?.choices?.[0]?.message?.content || ''
    }

    return response.status(200).json({ text: resultText })
  } catch (error) {
    console.error('Error calling AI API:', error)
    return response.status(500).json({ error: 'Internal Server Error' })
  }
}
