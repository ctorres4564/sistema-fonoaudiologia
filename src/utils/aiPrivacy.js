export const PRIVACY_NOTICE_VERSION = '1'

export const AI_PROVIDER = 'Gemini 1.5 Flash'

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
      'O texto clínico que você escrever será enviado a um provedor externo de IA (' + AI_PROVIDER + ') para processamento.',
      'NÃO inclua nomes, documentos (CPF/RG), telefone, endereço, e-mail ou outros dados pessoais identificáveis do paciente no texto enviado.',
      'A resposta gerada pela IA é um apoio textual e deve ser revisada pelo profissional antes de ser incorporada ao prontuário.',
      'A IA não substitui a avaliação clínica, o julgamento profissional nem a responsabilidade legal do fonoaudiólogo.',
    ],
    confirmLabel: 'Confirmar e enviar',
    cancelLabel: 'Cancelar',
    checkboxLabel: 'Não perguntar novamente nesta sessão',
  }
}
