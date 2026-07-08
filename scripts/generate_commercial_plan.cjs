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
  doc.fillColor(lightTextColor).fontSize(10).font('Helvetica').text('Relatorio de Viabilidade Tecnica, Legal, Arquitetura e Design para SaaS')
  doc.moveDown(1.5)

  // Linha divisoria
  doc.moveTo(50, doc.y).lineTo(545.28, doc.y).strokeColor(dividerColor).lineWidth(1).stroke()
  doc.moveDown(1.5)

  // Secao 1: Introducao
  doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('1. Introducao e Visao Geral')
  doc.moveDown(0.5)
  doc.fillColor(darkTextColor).fontSize(10).font('Helvetica').text(
    'O FonoFlow eh um sistema de gestao de pacientes fonoaudiologicos focado em home care. Para evoluir esta ferramenta para um produto comercialmente viavel para venda e assinatura (SaaS), implementamos adequacoes fundamentais de conformidade, limites de cotas e melhorias de experiencia (UX) no MVP, pavimentando o caminho para o lancamento comercial.',
    { align: 'justify', lineGap: 3 }
  )
  doc.moveDown(1.5)

  // Secao 2: Requisitos Legais
  doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('2. Requisitos Legais e de Conformidade')
  doc.moveDown(0.5)
  doc.fillColor(darkTextColor).fontSize(11).font('Helvetica-Bold').text('A. Lei Geral de Protecao de Dados (LGPD)')
  doc.fillColor(darkTextColor).fontSize(10).font('Helvetica').text(
    'Os prontuarios clinicos e anamneses coletados no FonoFlow enquadram-se como "Dados Pessoais Sensiveis" sob a LGPD (Art. 5, II):\n' +
    '- [CONCLUIDO] Termo de Consentimento Livre e Esclarecido (TCLE): Aceite obrigatorio integrado ao cadastro de pacientes e salvo com data/hora no Firestore para protecao juridica.\n' +
    '- [CONCLUIDO] Portabilidade e Exclusao: Botao de exportacao de prontuario completo em formato JSON estruturado para facil portabilidade de dados do paciente.\n' +
    '- [PLANEJADO] Trilha de Auditoria (Audit Log): Registro inalteravel de logs de acesso e alteracao (quem acessou, quando e qual dado foi modificado).',
    { lineGap: 3 }
  )
  doc.moveDown(0.8)
  
  doc.fillColor(darkTextColor).fontSize(11).font('Helvetica-Bold').text('B. Conselhos Profissionais (CFFa / CREFONO)')
  doc.fillColor(darkTextColor).fontSize(10).font('Helvetica').text(
    '- [PLANEJADO] Temporalidade dos Prontuarios: Configuracao de arquivamento seguro por no minimo 20 anos a partir do ultimo registro clínico conforme norma de saude.\n' +
    '- [CONCLUIDO] Termos de Sigilo: Clausulado juridico nos termos de uso cobrando senhas fortes e responsabilidade do profissional pelo sigilo dos dados.',
    { lineGap: 3 }
  )
  doc.moveDown(1.5)

  // Secao 3: Arquitetura Multi-Tenant
  doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('3. Arquitetura Multi-Tenant (Multi-Inquilino)')
  doc.moveDown(0.5)
  doc.fillColor(darkTextColor).fontSize(10).font('Helvetica').text(
    'Para que o sistema suporte centenas de clinicas simultaneas operando de forma isolada, estruturamos:\n' +
    '- [CONCLUIDO] Nivel de Uso e Planos no Banco: Criada a colecao de users no Firestore que escuta em tempo real se o plano eh "demo" ou "premium".\n' +
    '- [CONCLUIDO] Trava de Limite de Pacientes: Contas no plano demo estao limitadas a ate 20 pacientes ativos, exigindo upgrade para o plano ilimitado comercial.\n' +
    '- [PLANEJADO] Isolamento por Tenant ID: Associacao de todos os registros de pacientes e agendas a uma Clinica/Organizacao principal, liberando multiplos profissionais.',
    { lineGap: 3 }
  )
  doc.moveDown(1.5)

  // Secao 4: Requisitos Tecnicos e Custos de IA
  doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('4. Integrações Tecnicas e Faturamento')
  doc.moveDown(0.5)
  doc.fillColor(darkTextColor).fontSize(10).font('Helvetica').text(
    '- [CONCLUIDO] Rate Limiting de IA (DeepSeek): Limitacao automatica de 20 chamadas mensais de IA por profissional no plano demo para evitar gastos abusivos de API.\n' +
    '- [PLANEJADO] Gateway de Pagamentos: Integracao com a plataforma Asaas para faturamento recorrente automatico via Pix, Cartao de Credito e Boleto.\n' +
    '- [PLANEJADO] Bloqueio por Inadimplencia: Webhooks do gateway para suspender o acesso do usuario em atraso automaticamente, reativando apos confirmacao.',
    { lineGap: 3 }
  )
  doc.moveDown(1.5)

  // Secao 5: Design e UX
  doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('5. Experiencia do Usuario (UX) e Design')
  doc.moveDown(0.5)
  doc.fillColor(darkTextColor).fontSize(10).font('Helvetica').text(
    '- [CONCLUIDO] Acessibilidade WCAG e Alto Contraste: Layout de onboarding ajustado para legibilidade excelente no modo escuro.\n' +
    '- [CONCLUIDO] Fluxo de Onboarding Guiado: Banner interativo de 3 passos no topo do Dashboard com persistencia de visualizacao local.\n' +
    '- [CONCLUIDO] Indicador de Sincronismo Offline: Badge de rede em tempo real (Online/Offline) no cabecalho dando seguranca ao atendimento em transito.',
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
      fs.copyFileSync(pdfPath, path.join(publicDocsDir, 'Plano_de_Viabilidade_Comercial_FonoFlow.pdf'))
      console.log('PDF do Plano Comercial gerado com sucesso e copiado para public/docs!')
    } catch (err) {
      console.error('Erro ao copiar PDF para pasta public:', err)
    }
  })
}

generatePlanPDF()
