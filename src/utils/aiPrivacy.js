export function getAgeFromBirthDate(birthDate) {
  if (!birthDate) return null
  const [y, m, d] = birthDate.split('-')
  const birth = new Date(Number(y), Number(m) - 1, Number(d))
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export function buildAgeLabel(birthDate) {
  const age = getAgeFromBirthDate(birthDate)
  if (age === null) return 'idade não informada'
  if (age <= 2) return 'criança de aproximadamente ' + age + ' anos'
  if (age <= 12) return 'criança de aproximadamente ' + age + ' anos'
  if (age <= 17) return 'adolescente de aproximadamente ' + age + ' anos'
  if (age <= 59) return 'adulto de aproximadamente ' + age + ' anos'
  return 'idoso de aproximadamente ' + age + ' anos'
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function minimizeClinicalText(text, patient) {
  if (!text) return ''

  let result = text

  const patientNames = []
  const guardianNames = []

  if (patient?.guardian) {
    guardianNames.push(patient.guardian)
    const gParts = patient.guardian.split(/\s+/)
    if (gParts.length > 1 && gParts[0].length > 1) {
      guardianNames.push(gParts[0])
    }
  }

  if (patient?.name) {
    patientNames.push(patient.name)
    const pParts = patient.name.split(/\s+/)
    if (pParts.length > 1 && pParts[0].length > 1) {
      patientNames.push(pParts[0])
    }
  }

  const replaceNames = (names, marker) => {
    const sorted = [...names].sort((a, b) => b.length - a.length)
    for (const name of sorted) {
      if (!name || name.length < 2) continue
      const escaped = escapeRegex(name)
      const regex = new RegExp('\\b' + escaped + '\\b', 'gi')
      result = result.replace(regex, marker)
    }
  }

  replaceNames(guardianNames, '[RESPONSÁVEL]')
  replaceNames(patientNames, '[PACIENTE]')

  result = result.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '[EMAIL]'
  )

  const phonePatterns = []
  if (patient?.phone) {
    phonePatterns.push(escapeRegex(patient.phone))
    const digitsOnly = patient.phone.replace(/\D/g, '')
    if (digitsOnly.length >= 10) {
      phonePatterns.push(escapeRegex(digitsOnly))
    }
  }
  for (const pattern of phonePatterns) {
    if (!pattern) continue
    result = result.replace(new RegExp(pattern, 'g'), '[TELEFONE]')
  }

  result = result.replace(
    /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,
    (match) => {
      const digits = match.replace(/\D/g, '')
      if (digits.length === 11) return '[DOCUMENTO]'
      return match
    }
  )

  result = result.replace(
    /(?:(?:\+?55)?[\s-]?)?(?:\(?\d{2}\)?[\s-]?)?\d{4,5}[-.\s]?\d{4}\b(?!\s*[.-]?\s*\d)/g,
    (match) => {
      const digits = match.replace(/\D/g, '')
      if (digits.length >= 10 && digits.length <= 13) return '[TELEFONE]'
      return match
    }
  )

  result = result.replace(
    /\b\d{5}-?\d{3}\b/g,
    (match) => {
      const digits = match.replace(/\D/g, '')
      if (digits.length === 8) return '[ENDEREÇO]'
      return match
    }
  )

  result = result.replace(
    /\b\d{2}\/\d{2}\/\d{4}\b/g,
    (match) => {
      const [d, m, y] = match.split('/')
      const day = parseInt(d, 10)
      const month = parseInt(m, 10)
      const year = parseInt(y, 10)
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
        return '[DATA]'
      }
      return match
    }
  )

  if (patient?.address && patient.address.length > 5) {
    const fullAddrRegex = new RegExp(escapeRegex(patient.address), 'gi')
    if (fullAddrRegex.test(result)) {
      result = result.replace(fullAddrRegex, '[ENDEREÇO]')
    } else {
      const addressParts = patient.address.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)
      for (const part of addressParts) {
        if (part.length > 5) {
          const addrRegex = new RegExp(escapeRegex(part), 'gi')
          result = result.replace(addrRegex, '[ENDEREÇO]')
        }
      }
    }
  }

  return result
}

export function sanitizeAiPlainText(text) {
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

const AI_ACTIONS = {
  'refine-notes': {
    systemInstruction: 'Você é um fonoaudiólogo especialista em atendimento domiciliar. Seu papel é receber anotações clínicas informais, rápidas ou desestruturadas e formatá-las em um prontuário técnico formal, claro, de alto padrão clínico fonoaudiológico e em português. Mantenha os fatos relatados exatamente iguais, mas use linguagem profissional técnica fonoaudiológica. Retorne APENAS o prontuário refinado em parágrafo limpo, sem nenhuma introdução ou observação extra.',
    buildPrompt: (clinicalData) => {
      return 'Formate a seguinte anotação clínica em um prontuário técnico fonoaudiológico:\n\n' + clinicalData.notes
    },
  },
  'generate-exercises': {
    systemInstruction: 'Você é um fonoaudiólogo especialista em atendimento domiciliar infantil e adulto. Seu papel é propor sugestões práticas, criativas e divertidas de atividades e jogos fonoaudiológicos domiciliares que os pais ou o próprio paciente possam realizar para tratar uma queixa específica de fala ou linguagem. Responda em tópicos limpos, diretos e objetivos em português.',
    buildPrompt: (clinicalData) => {
      const ageLabel = buildAgeLabel(clinicalData.birthDate)
      return 'Gere sugestões de exercícios e atividades domiciliares personalizadas para ' + ageLabel + ' com a seguinte queixa fonoaudiológica: "' + clinicalData.complaint + '"'
    },
  },
  'analyze-progress': {
    systemInstruction: 'Você é um fonoaudiólogo consultor sênior. Seu papel é analisar o histórico de evoluções clínicas de um paciente em atendimento domiciliar e escrever um parecer clínico de progresso. Aponte de forma direta os principais avanços obtidos, as maiores barreiras ou dificuldades persistentes relatadas e sugira as próximas direções terapêuticas ou condutas para otimizar os resultados. Seja técnico, formal, acolhedor e focado no atendimento domiciliar. Responda em português.',
    buildPrompt: (clinicalData) => {
      return 'Analise o seguinte histórico de evoluções clínicas e produza um parecer de progresso:\n\n' + clinicalData.evolutionsText
    },
  },
}

export function getAIActionConfig(type) {
  return AI_ACTIONS[type] || null
}

export function buildSanitizedPrompt(type, clinicalData) {
  const config = getAIActionConfig(type)
  if (!config) {
    throw new Error('Tipo de ação de IA desconhecido: ' + type)
  }
  return {
    prompt: config.buildPrompt(clinicalData),
    systemInstruction: config.systemInstruction,
  }
}

export function getConsentMessages() {
  return {
    title: 'Uso de Inteligência Artificial',
    body: [
      'Dados clínicos minimizados serão enviados a um provedor externo de IA (Gemini 1.5 Flash) para processamento.',
      'Identificadores conhecidos (nome, telefone, e-mail, CPF, endereço, data de nascimento) serão substituídos por marcadores neutros antes do envio.',
      'A resposta gerada pela IA é um apoio textual e deve ser revisada pelo profissional antes de ser incorporada ao prontuário.',
      'A IA não substitui a avaliação clínica, o julgamento profissional nem a responsabilidade legal do fonoaudiólogo.',
    ],
    confirmLabel: 'Confirmar e enviar',
    cancelLabel: 'Cancelar',
  }
}
