const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

function generatePendenciesPDF() {
  const docsDir = path.join(__dirname, '..', 'docs')
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true })
  }

  const pdfPath = path.join(docsDir, 'Plano_de_Pendencias_Comercializacao_FonoFlow.pdf')
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  })

  const stream = fs.createWriteStream(pdfPath)
  doc.pipe(stream)

  // Cores institucionais
  const primaryColor = '#4C1D95' // Plum 600
  const secondaryColor = '#D97706' // Gold 600
  const darkTextColor = '#1F2937' // Neutral 800
  const lightTextColor = '#4B5563' // Neutral 600
  const dividerColor = '#E5E7EB' // Neutral 200

  // Cabeçalho institucional
  doc.rect(0, 0, 595.28, 15).fill(primaryColor)

  doc.moveDown(2)
  doc.fillColor(primaryColor).fontSize(24).font('Helvetica-Bold').text('FonoFlow', { inline: true })
  doc.fillColor(secondaryColor).fontSize(24).font('Helvetica-Bold').text(' - Pendencias SaaS', { inline: true })
  doc.moveDown(0.2)
  doc.fillColor(lightTextColor).fontSize(10).font('Helvetica').text('Roadmap de Requisitos Pendentes para Lancamento Comercial')
  doc.moveDown(1.5)

  // Linha divisoria
  doc.moveTo(50, doc.y).lineTo(545.28, doc.y).strokeColor(dividerColor).lineWidth(1).stroke()
  doc.moveDown(1.5)

  // Introdução
  doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('1. Visao Geral de Pendencias')
  doc.moveDown(0.5)
  doc.fillColor(darkTextColor).fontSize(10).font('Helvetica').text(
    'Este documento detalha exclusivamente as funcionalidades e integracoes que restam ser desenvolvidas para habilitar a venda publica de assinaturas recorrentes do FonoFlow com segurança juridica, automatizacao financeira e escalabilidade.',
    { align: 'justify', lineGap: 3 }
  )
  doc.moveDown(1.5)

  // Faturamento
  doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('2. Faturamento e Cobranca Recorrente')
  doc.moveDown(0.5)
  doc.fillColor(darkTextColor).fontSize(10).font('Helvetica').text(
    'Para eliminar processos de liberacao manual de planos pelo administrador:\n' +
    '• Integracao Asaas: Automatizacao da emissao de cobrancas de mensalidades via Pix recorrente, Boleto e Cartao.\n' +
    '• Portal de Faturamento: Tela interna para o cliente alterar dados de cartao, ver historico de faturas e gerenciar plano.\n' +
    '• Bloqueio por Inadimplencia: Webhook que suspende automaticamente o acesso de escrita caso o pagamento atrase.',
    { lineGap: 3 }
  )
  doc.moveDown(1.5)

  // Segurança
  doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('3. Seguranca da Informacao Clinica (LGPD)')
  doc.moveDown(0.5)
  doc.fillColor(darkTextColor).fontSize(10).font('Helvetica').text(
    'Como o sistema armazena dados de saude (dados sensiveis sob a LGPD):\n' +
    '• Criptografia no Banco: Criptografar as anamneses e evolucoes de prontuarios diretamente antes do envio ao Firestore, tornando-os ilegiveis para qualquer pessoa sem a chave do profissional.\n' +
    '• Trilha de Auditoria: Registro inalteravel de log indicando quem acessou, visualizou ou alterou prontuarios clinicos.\n' +
    '• Guarda de Longo Prazo (20 Anos): Rotina de backups redundantes a frio em servidores de arquivamento (ex: AWS Glacier).',
    { lineGap: 3 }
  )
  doc.moveDown(1.5)

  // Multi-tenant
  doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('4. Multi-Tenant para Clinicas')
  doc.moveDown(0.5)
  doc.fillColor(darkTextColor).fontSize(10).font('Helvetica').text(
    'Para suportar clinicas inteiras dividindo pacientes e acessos de secretarias:\n' +
    '• Isolamento por Tenant ID: Associacao de pacientes e agendas a uma entidade Clinica/Organizacao centralizada.\n' +
    '• Niveis de Acesso (RBAC): Permissoes restritas para secretarias (agenda e cadastros) e fonoaudiologos assistentes (prontuarios).',
    { lineGap: 3 }
  )

  // Rodape institucional
  doc.fontSize(8).fillColor(lightTextColor)
  doc.text('Gerado automaticamente pelo sistema FonoFlow. Todos os direitos reservados.', 50, 770, { align: 'center' })

  doc.end()

  stream.on('finish', () => {
    try {
      const publicDocsDir = path.join(__dirname, '..', 'public', 'docs')
      if (!fs.existsSync(publicDocsDir)) {
        fs.mkdirSync(publicDocsDir, { recursive: true })
      }
      fs.copyFileSync(pdfPath, path.join(publicDocsDir, 'Plano_de_Pendencias_Comercializacao_FonoFlow.pdf'))
      console.log('PDF de Pendencias gerado com sucesso e copiado para public/docs!')
    } catch (err) {
      console.error('Erro ao copiar PDF para pasta public:', err)
    }
  })
}

generatePendenciesPDF()
