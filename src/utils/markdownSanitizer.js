/**
 * Remove marcadores comuns de Markdown de respostas de IA destinadas a campos textarea.
 * A função preserva o texto clínico visível, pontuação normal, siglas e fonemas como /r/ e /s/.
 * @param {string} value
 * @returns {string}
 */
export function sanitizeAiPlainText(value = '') {
  if (typeof value !== 'string') return ''

  return value
    .replace(/\r\n?/g, '\n')
    // Remover cercas de código, preservando o conteúdo clínico dentro delas.
    .replace(/^\s*```[\w-]*\s*\n?/gm, '')
    // Links Markdown: preservar apenas o texto visível.
    .replace(/\[([^\]\n]+)]\(([^)\n]+)\)/g, '$1')
    // Títulos Markdown: remover apenas os marcadores # do início da linha.
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    // Negrito Markdown.
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/__([^_\n]+)__/g, '$1')
    // Itálico Markdown com asterisco, sem afetar pontuação normal.
    .replace(/(^|[\s([{])\*([^*\n]+)\*(?=[\s\])}.,;:!?]|$)/g, '$1$2')
    // Itálico Markdown com underline, sem afetar underscores dentro de palavras ou siglas.
    .replace(/(^|[\s([{])_([^_\n]+)_(?=[\s\])}.,;:!?]|$)/g, '$1$2')
    // Marcadores de lista no início da linha: remover o marcador, preservar o conteúdo.
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    // Limpeza conservadora de espaços ao fim de linha e excesso de linhas vazias.
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
