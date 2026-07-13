import { describe, it, expect } from 'vitest'
import {
  minimizeClinicalText,
  sanitizeAiPlainText,
  buildAgeLabel,
  getAgeFromBirthDate,
  buildSanitizedPrompt,
  getAIActionConfig,
} from './aiPrivacy'

const mockPatient = {
  name: 'Maria Clara Silva',
  guardian: 'Joana Silva',
  phone: '(11) 99999-8888',
  address: 'Rua das Flores, 123, apto 45, São Paulo - SP',
  birthDate: '2019-05-15',
}

describe('minimizeClinicalText', () => {
  it('substitui nome completo do paciente', () => {
    const result = minimizeClinicalText('Maria Clara Silva veio para consulta', mockPatient)
    expect(result).toBe('[PACIENTE] veio para consulta')
  })

  it('substitui primeiro nome do paciente', () => {
    const result = minimizeClinicalText('Maria apresentou melhora no fonema /s/', mockPatient)
    expect(result).toBe('[PACIENTE] apresentou melhora no fonema /s/')
  })

  it('substitui nome do responsável', () => {
    const result = minimizeClinicalText('Veio acompanhado de Joana Silva', mockPatient)
    expect(result).toBe('Veio acompanhado de [RESPONSÁVEL]')
  })

  it('substitui telefone conhecido', () => {
    const result = minimizeClinicalText('Contato: (11) 99999-8888', mockPatient)
    expect(result).toBe('Contato: [TELEFONE]')
  })

  it('substitui telefone só com dígitos', () => {
    const result = minimizeClinicalText('Contato: 11999998888', mockPatient)
    expect(result).toBe('Contato: [TELEFONE]')
  })

  it('substitui e-mail por [EMAIL]', () => {
    const result = minimizeClinicalText('Email: paciente@teste.com', mockPatient)
    expect(result).toBe('Email: [EMAIL]')
  })

  it('substitui CPF formatado', () => {
    const result = minimizeClinicalText('CPF: 123.456.789-00', mockPatient)
    expect(result).toBe('CPF: [DOCUMENTO]')
  })

  it('substitui CPF sem formatação', () => {
    const result = minimizeClinicalText('CPF: 12345678900', mockPatient)
    expect(result).toBe('CPF: [DOCUMENTO]')
  })

  it('substitui CEP', () => {
    const result = minimizeClinicalText('CEP: 01234-567', mockPatient)
    expect(result).toBe('CEP: [ENDEREÇO]')
  })

  it('substitui data dd/mm/aaaa por [DATA]', () => {
    const result = minimizeClinicalText('Nascimento: 15/05/2019', mockPatient)
    expect(result).toBe('Nascimento: [DATA]')
  })

  it('substitui endereço conhecido', () => {
    const result = minimizeClinicalText('Mora na Rua das Flores, 123, apto 45, São Paulo - SP', mockPatient)
    expect(result).toBe('Mora na [ENDEREÇO]')
  })

  it('preserva fonema /r/', () => {
    const result = minimizeClinicalText('Paciente produz o fonema /r/ com dificuldade', mockPatient)
    expect(result).toContain('/r/')
  })

  it('preserva fonema /s/', () => {
    const result = minimizeClinicalText('Paciente produz o fonema /s/ corretamente', mockPatient)
    expect(result).toContain('/s/')
  })

  it('preserva texto clínico não identificável', () => {
    const text = 'Paciente apresentou melhora na produção de consoantes em posição inicial. Realizou exercícios de respiração diafragmática.'
    const result = minimizeClinicalText(text, mockPatient)
    expect(result).toContain('melhora na produção de consoantes')
    expect(result).toContain('exercícios de respiração diafragmática')
  })

  it('retorna string vazia para entrada vazia', () => {
    expect(minimizeClinicalText('', mockPatient)).toBe('')
    expect(minimizeClinicalText(null, mockPatient)).toBe('')
    expect(minimizeClinicalText(undefined, mockPatient)).toBe('')
  })

  it('não substitui números não identificáveis', () => {
    const result = minimizeClinicalText('Total de 15 sessões realizadas', mockPatient)
    expect(result).toContain('15')
  })

  it('não modifica texto sem paciente', () => {
    const text = 'Texto clínico sem dados pessoais'
    expect(minimizeClinicalText(text, {})).toBe(text)
    expect(minimizeClinicalText(text, null)).toBe(text)
    expect(minimizeClinicalText(text, undefined)).toBe(text)
  })

  it('substitui múltiplas ocorrências do mesmo nome', () => {
    const text = 'Maria veio para a sessão. Maria estava animada. Maria fez os exercícios.'
    const result = minimizeClinicalText(text, mockPatient)
    expect(result).not.toContain('Maria')
    expect(result.split('[PACIENTE]').length - 1).toBe(3)
  })

  it('não substitui partes de palavras que coincidem com nome', () => {
    const result = minimizeClinicalText('O material foi entregue', { name: 'Maria' })
    expect(result).toBe('O material foi entregue')
  })
})

describe('sanitizeAiPlainText', () => {
  it('remove cabeçalhos Markdown #', () => {
    expect(sanitizeAiPlainText('# Título\nConteúdo')).toBe('Título\nConteúdo')
  })

  it('remove negrito **', () => {
    expect(sanitizeAiPlainText('Texto **negrito** normal')).toBe('Texto negrito normal')
  })

  it('remove itálico *', () => {
    expect(sanitizeAiPlainText('Texto *itálico* normal')).toBe('Texto itálico normal')
  })

  it('remove underscore', () => {
    expect(sanitizeAiPlainText('Texto _itálico_ normal')).toBe('Texto itálico normal')
  })

  it('remove código inline com backtick', () => {
    expect(sanitizeAiPlainText('Use `console.log()`')).toBe('Use console.log()')
  })

  it('remove links', () => {
    expect(sanitizeAiPlainText('Veja [link](http://exemplo.com)')).toBe('Veja link')
  })

  it('preserva /r/ e /s/ intactos', () => {
    const result = sanitizeAiPlainText('Fonemas /r/ e /s/ foram trabalhados')
    expect(result).toContain('/r/')
    expect(result).toContain('/s/')
  })

  it('preserva parágrafos', () => {
    const text = 'Primeiro parágrafo.\n\nSegundo parágrafo.'
    expect(sanitizeAiPlainText(text)).toBe(text)
  })

  it('retorna string vazia para entrada vazia', () => {
    expect(sanitizeAiPlainText('')).toBe('')
    expect(sanitizeAiPlainText(null)).toBe('')
    expect(sanitizeAiPlainText(undefined)).toBe('')
  })

  it('preserva números de sessão', () => {
    expect(sanitizeAiPlainText('Sessão 1: exercícios\nSessão 2: avanço')).toContain('Sessão')
  })

  it('preserva siglas', () => {
    expect(sanitizeAiPlainText('O paciente apresentou melhora no PEATE')).toBe('O paciente apresentou melhora no PEATE')
  })
})

describe('buildSanitizedPrompt', () => {
  it('refine-notes não contém nome do paciente', () => {
    const { prompt } = buildSanitizedPrompt('refine-notes', { notes: 'Texto clínico' })
    expect(prompt).not.toContain('paciente')
    expect(prompt).toContain('Texto clínico')
  })

  it('generate-exercises usa buildAgeLabel, não birthDate', () => {
    const { prompt } = buildSanitizedPrompt('generate-exercises', {
      complaint: 'Dificuldade no /s/',
      birthDate: '2019-05-15',
    })
    expect(prompt).not.toContain('2019-05-15')
    expect(prompt).not.toContain('2019')
    expect(prompt).toContain('criança')
    expect(prompt).toContain('Dificuldade no /s/')
  })

  it('analyze-progress não contém nome do paciente', () => {
    const { prompt } = buildSanitizedPrompt('analyze-progress', {
      evolutionsText: '[Sessão 2026-06-10]: Texto clínico',
    })
    expect(prompt).not.toMatch(/paciente [A-Z][a-z]+/)
    expect(prompt).toContain('Texto clínico')
  })

  it('lança erro para tipo desconhecido', () => {
    expect(() => buildSanitizedPrompt('unknown-type', {})).toThrow('Tipo de ação de IA desconhecido')
  })
})

describe('getAIActionConfig', () => {
  it('retorna config para refine-notes', () => {
    const config = getAIActionConfig('refine-notes')
    expect(config).not.toBeNull()
    expect(config.systemInstruction).toContain('fonoaudiólogo')
  })

  it('retorna config para generate-exercises', () => {
    const config = getAIActionConfig('generate-exercises')
    expect(config).not.toBeNull()
    expect(config.systemInstruction).toContain('fonoaudiólogo')
  })

  it('retorna config para analyze-progress', () => {
    const config = getAIActionConfig('analyze-progress')
    expect(config).not.toBeNull()
    expect(config.systemInstruction).toContain('fonoaudiólogo')
  })

  it('retorna null para tipo desconhecido', () => {
    expect(getAIActionConfig('unknown')).toBeNull()
  })
})

describe('getAgeFromBirthDate', () => {
  it('calcula idade corretamente', () => {
    expect(getAgeFromBirthDate('2019-05-15')).not.toBeNull()
  })

  it('retorna null para data vazia', () => {
    expect(getAgeFromBirthDate(null)).toBeNull()
    expect(getAgeFromBirthDate('')).toBeNull()
  })
})

describe('buildAgeLabel', () => {
  it('retorna idade aproximada', () => {
    const label = buildAgeLabel('2019-05-15')
    expect(label).toMatch(/criança|adolescente|adulto|idoso/)
    expect(label).toContain('aproximadamente')
  })

  it('retorna texto padrão sem data', () => {
    expect(buildAgeLabel(null)).toBe('idade não informada')
  })
})
