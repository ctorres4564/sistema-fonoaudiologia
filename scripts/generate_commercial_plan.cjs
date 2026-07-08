const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

function generatePlanPDF() {
  const docsDir = path.join(__dirname, '..', 'docs')
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true })
  }

  const pdfPath = path.join(docsDir, 'Plano_de_Viabilidade_Comercial_FonoFlow.pdf')
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
  const bgLight = '#F9FAFB' // Neutral 50
  const dividerColor = '#E5E7EB' // Neutral 200

  // Cabeçalho institucional
  doc.rect(0, 0, 595.28, 15).fill(primaryColor)

  doc.moveDown(2)
  doc.fillColor(primaryColor).fontSize(24).font('Helvetica-Bold').text('FonoFlow', { inline: true })
  doc.fillColor(secondaryColor).fontSize(24).font('Helvetica-Bold').text(' - Plano Comercial', { inline: true })
  doc.moveDown(0.2)
  doc.fillColor(lightTextColor).fontSize(10).font('Helvetica').text('Relatório de Viabilidade Técnica, Legal, Arquitetura e Design para SaaS')
  doc.moveDown(1.5)

  // Linha divisória
  doc.moveTo(50, doc.y).lineTo(545.28, doc.y).strokeColor(dividerColor).lineWidth(1).stroke()
  doc.moveDown(1.5)

  // Seção 1: Introdução
  doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('1. Introdução e Visão Geral')
  doc.moveDown(0.5)
  doc.fillColor(darkTextColor).fontSize(10).font('Helvetica').text(
    'O FonoFlow é um sistema de gestão de pacientes fonoaudiológicos focado em home care. Para evoluir esta ferramenta para um produto comercialmente viável para venda e assinatura (SaaS), é necessária a implementação de requisitos que garantam segurança, conformidade legal com a LGPD e conselhos profissionais, suporte multi-tenant e processos automatizados de cobrança.',
    { align: 'justify', lineGap: 3 }
  )
  doc.moveDown(1.5)

  // Seção 2: Requisitos Legais
  doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('2. Requisitos Legais e de Conformidade')
  doc.moveDown(0.5)
  doc.fillColor(darkTextColor).fontSize(11).font('Helvetica-Bold').text('A. Lei Geral de Proteção de Dados (LGPD)')
  doc.fillColor(darkTextColor).fontSize(10).font('Helvetica').text(
    'Os prontuários clínicos e anamneses coletados no FonoFlow enquadram-se como "Dados Pessoais Sensíveis" sob a LGPD (Art. 5, II):\n' +
    '• Termo de Consentimento Livre e Esclarecido (TCLE): Implementação de aceite obrigatório do termo por pacientes ou responsáveis legais antes do início de qualquer tratamento.\n' +
    '• Portabilidade e Exclusão: Criação de mecanismos para exportação total dos prontuários (portabilidade) e exclusão definitiva de registros clínicos se solicitada pelo paciente.\n' +
    '• Trilha de Auditoria (Audit Log): Registro inalterável de logs de acesso e alteração (quem acessou, quando e qual dado foi modificado).',
    { lineGap: 3 }
  )
  doc.moveDown(0.8)
  
  doc.fillColor(darkTextColor).fontSize(11).font('Helvetica-Bold').text('B. Conselhos Profissionais (CFFa / CREFONO)')
  doc.fillColor(darkTextColor).fontSize(10).font('Helvetica').text(
    '• Temporalidade dos Prontuários: Conforme regulamentação federal, prontuários de saúde devem ser arquivados e preservados de forma segura por no mínimo 20 anos a partir do último registro.\n' +
    '• Termos de Sigilo: Clausulado jurídico nos Termos de Uso do sistema isentando a plataforma por vazamentos decorrentes de mau uso de senhas ou acessos compartilhados indevidamente pelos profissionais.',
    { lineGap: 3 }
  )
  doc.moveDown(1.5)

  // Seção 3: Arquitetura Multi-Tenant
  doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('3. Arquitetura Multi-Tenant (Multi-Inquilino)')
  doc.moveDown(0.5)
  doc.fillColor(darkTextColor).fontSize(10).font('Helvetica').text(
    'Para que o sistema suporte centenas de clínicas simultâneas operando de forma isolada, a arquitetura deve evoluir para:\n' +
    '• Isolamento de Banco de Dados: Criação do conceito de Tenant ID. Todos os registros de pacientes, agendas e relatórios devem ser vinculados a um ID de consultório/clínica, e não apenas ao usuário individual.\n' +
    '• Níveis de Acesso: Suporte a múltiplos usuários sob o mesmo Tenant (ex: administrador da clínica, fonoaudiólogos assistentes e secretárias) com controle de visibilidade restrita.\n' +
    '• Limitação por Planos: Validação sistêmica em tempo real de limites de acordo com a assinatura do usuário (ex: limite de pacientes ativos e volumetria de consultas por semana).',
    { lineGap: 3 }
  )
  doc.moveDown(1.5)

  // Seção 4: Requisitos Técnicos
  doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('4. Integrações Técnicas e Faturamento')
  doc.moveDown(0.5)
  doc.fillColor(darkTextColor).fontSize(10).font('Helvetica').text(
    '• Gateway de Pagamentos: Integração com plataformas como Asaas ou Stripe Billing para gerenciar faturamento recorrente automático (Pix recorrente, Cartão de Crédito e Boleto).\n' +
    '• Bloqueio por Inadimplência: Automatização via webhooks para suspender acessos à escrita e leitura de prontuários após atrasos de faturamento, com liberação automática pós-compensação.\n' +
    '• Criptografia de Dados Clínicos: Criptografar as observações e evoluções de prontuários em repouso no banco de dados, garantindo que nem mesmo administradores do banco de dados tenham acesso aos textos puros.\n' +
    '• Rate Limiting de Inteligência Artificial: Proxy intermediário para limitar chamadas de IA (DeepSeek) por profissional, impedindo abusos na API Key de faturamento central.',
    { lineGap: 3 }
  )
  doc.moveDown(1.5)

  // Seção 5: Design e UX
  doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('5. Experiência do Usuário (UX) e Design')
  doc.moveDown(0.5)
  doc.fillColor(darkTextColor).fontSize(10).font('Helvetica').text(
    '• Acessibilidade WCAG: Adequação de contraste em todo o painel e otimização para leitura em ambientes externos (essencial para atendimento em home care).\n' +
    '• Fluxo de Onboarding: Tour guiado para os novos usuários no primeiro acesso, reduzindo a taxa de churn e a quantidade de chamados de suporte técnico.\n' +
    '• Indicador de Sincronismo Offline: Notificações visuais claras de sincronia dos dados para os profissionais que trabalham em trânsito e sem conexão de dados contínua.',
    { lineGap: 3 }
  )

  // Rodapé institucional
  doc.fontSize(8).fillColor(lightTextColor)
  doc.text('Gerado automaticamente pelo sistema FonoFlow. Todos os direitos reservados.', 50, 770, { align: 'center' })

  doc.end()

  stream.on('finish', () => {
    try {
      const publicDocsDir = path.join(__dirname, '..', 'public', 'docs')
      if (!fs.existsSync(publicDocsDir)) {
        fs.mkdirSync(publicDocsDir, { recursive: true })
      }
      fs.copyFileSync(pdfPath, path.join(publicDocsDir, 'Plano_de_Viabilidade_Comercial_FonoFlow.pdf'))
      console.log('PDF do Plano Comercial gerado com sucesso e copiado para public/docs!')
    } catch (err) {
      console.error('Erro ao copiar PDF para pasta public:', err)
    }
  })
}

generatePlanPDF()
