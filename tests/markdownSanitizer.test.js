import test from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeAiPlainText } from '../src/utils/markdownSanitizer.js'

test('remove negrito de título de prontuário sem remover conteúdo', () => {
  assert.equal(
    sanitizeAiPlainText('**Prontuário Fonoaudiológico**'),
    'Prontuário Fonoaudiológico',
  )
})

test('remove negrito de seção com dois pontos', () => {
  assert.equal(
    sanitizeAiPlainText('**Descrição da Sessão:** Paciente colaborativo.'),
    'Descrição da Sessão: Paciente colaborativo.',
  )
})

test('preserva fonemas entre barras e remove marcadores de lista', () => {
  const input = '- Trabalhou produção de /r/ em sílabas.\n* Estimulou contraste entre /s/ e /z/.'
  const output = 'Trabalhou produção de /r/ em sílabas.\nEstimulou contraste entre /s/ e /z/.'

  assert.equal(sanitizeAiPlainText(input), output)
})

test('remove títulos, cercas de código e links Markdown preservando texto visível', () => {
  const input = '# Evolução\n```\n[Orientação familiar](https://example.com): manter treino diário.\n```'
  const output = 'Evolução\nOrientação familiar: manter treino diário.'

  assert.equal(sanitizeAiPlainText(input), output)
})

test('preserva texto sem Markdown inalterado', () => {
  const input = 'Paciente realizou exercícios articulatórios para /r/ e /s/ com boa participação.'

  assert.equal(sanitizeAiPlainText(input), input)
})

test('preserva numeração em sugestões de atividades e remove Markdown restante', () => {
  const input = `**Sugestões de atividades domiciliares**
1. Treinar o fonema /s/ em palavras.
2. Usar [figuras familiares](https://example.com) durante a brincadeira.`
  const output = `Sugestões de atividades domiciliares
1. Treinar o fonema /s/ em palavras.
2. Usar figuras familiares durante a brincadeira.`

  assert.equal(sanitizeAiPlainText(input), output)
})

test('limpa análise de evolução sem remover siglas, pontuação ou fonemas', () => {
  const input = `## Análise do Histórico
__Evolução:__ melhora em motricidade orofacial.
- Manter treino de /r/ e /s/.
- Orientar família sobre AVDs.`
  const output = `Análise do Histórico
Evolução: melhora em motricidade orofacial.
Manter treino de /r/ e /s/.
Orientar família sobre AVDs.`

  assert.equal(sanitizeAiPlainText(input), output)
})

