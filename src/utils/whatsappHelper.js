/**
 * Limpa o número de telefone mantendo apenas dígitos e adiciona o DDI do Brasil (55) caso não exista.
 * @param {string} phone
 * @returns {string}
 */
export function formatPhoneForWhatsApp(phone) {
  if (!phone) return ''

  // Remover tudo que não for número
  let cleaned = phone.replace(/\D/g, '')

  // Se não começar com 55 e tiver tamanho de celular brasileiro (10 ou 11 dígitos)
  if (!cleaned.startsWith('55') && (cleaned.length === 10 || cleaned.length === 11)) {
    cleaned = '55' + cleaned
  }

  return cleaned
}

/**
 * Cria o link da API do WhatsApp para envio do lembrete de atendimento domiciliar.
 * @param {string} phone
 * @param {string} patientName
 * @param {string} date - formato YYYY-MM-DD
 * @param {string} startTime - formato HH:MM
 * @returns {string}
 */
export function getWhatsAppReminderLink(phone, patientName, date, startTime) {
  const formattedPhone = formatPhoneForWhatsApp(phone)
  if (!formattedPhone) return ''

  // Formatar data de YYYY-MM-DD para DD/MM
  let formattedDate = date
  try {
    const [, m, d] = date.split('-')
    formattedDate = `${d}/${m}`
  } catch {
    // Fallback
  }

  const message = `Olá! Confirmamos o atendimento domiciliar de ${patientName} no dia ${formattedDate} às ${startTime}. Estarei aí no horário combinado!`
  const encodedText = encodeURIComponent(message)

  return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`
}
