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

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return response.status(500).json({ error: 'GEMINI_API_KEY is not configured on Vercel.' })
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

    const bodyPayload = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    }

    if (systemInstruction) {
      bodyPayload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      }
    }

    const apiResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
    })

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      return response.status(apiResponse.status).json({ error: `Gemini API error: ${errorText}` })
    }

    const data = await apiResponse.json()
    const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return response.status(200).json({ text: resultText })
  } catch (error) {
    console.error('Error calling Gemini API:', error)
    return response.status(500).json({ error: 'Internal Server Error' })
  }
}
