const fs = require('fs')
const path = require('path')
const PDFDocument = require('pdfkit')

function generatePDF() {
  const docsDir = path.join(__dirname, '..', 'docs')
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true })
  }

  const pdfPath = path.join(docsDir, 'Guia_do_Usuario_FonoFlow.pdf')
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 54, bottom: 54, left: 54, right: 54 }
  })

  const stream = fs.createWriteStream(pdfPath)
  doc.pipe(stream)

  // Cores institucionais
  const primaryColor = '#4C1D95' // Plum 900
  const secondaryColor = '#D97706' // Gold 600
  const textColor = '#1F2937' // Neutral 800
  const grayColor = '#4B5563' // Neutral 600

  // ------------------ CAPA ------------------
  doc.y = 120
  
  // Título FonoFlow
  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(32)
    .text('FonoFlow', { align: 'left' })
    .moveDown(0.2)

  // Subtítulo
  doc
    .fillColor(secondaryColor)
    .font('Helvetica-Bold')
    .fontSize(16)
    .text('Manual e Guia de Uso Completo do Usuário', { align: 'left' })
    .moveDown(0.2)

  doc
    .fillColor(grayColor)
    .font('Helvetica-Oblique')
    .fontSize(11)
    .text('Sistema Inteligente de Gestão de Pacientes e Atendimento Fonoaudiológico Domiciliar', { align: 'left' })
    .moveDown(4)

  // Metadados da Capa
  const startX = doc.x
  const startY = doc.y

  doc
    .rect(startX, startY, 504, 110)
    .fillColor('#F3F4F6')
    .fill()

  doc.fillColor(textColor).font('Helvetica-Bold').fontSize(10)
  
  // Coluna 1
  doc.text('Versão: 1.1', startX + 15, startY + 15)
  doc.text('Ambiente: Vercel Production', startX + 15, startY + 45)
  doc.text('Plataforma: Web (Desktop & Mobile)', startX + 15, startY + 75)

  // Coluna 2
  doc.text('Autor: Antigravity AI', startX + 260, startY + 15)
  doc.text('Banco de Dados: Cloud Firestore', startX + 260, startY + 45)
  doc.text('Data de Geração: Julho de 2026', startX + 260, startY + 75)

  // ------------------ PÁGINA 1: INTRODUÇÃO ------------------
  doc.addPage()

  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(18)
    .text('1. Introdução ao FonoFlow')
    .moveDown(0.5)

  doc
    .fillColor(textColor)
    .font('Helvetica')
    .fontSize(10.5)
    .text(
      'O FonoFlow é uma plataforma web premium sob medida para fonoaudiólogos, focada no fluxo de trabalho de atendimento domiciliar (home care). O sistema foi projetado para ser leve, rápido, responsivo (com perfeito funcionamento em smartphones e tablets) e possui integração direta com Inteligência Artificial para otimizar o registro de prontuários.',
      { align: 'justify' }
    )
    .moveDown(0.8)

  doc
    .fillColor(secondaryColor)
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('Principais Diferenciais:')
    .moveDown(0.4)

  const bulletsSection1 = [
    '• Atendimento Domiciliar: Textos e mensagens adaptados à realidade de fonoaudiologia home care.',
    '• Prontuário de Duas Abas: Histórico cronológico de evoluções e ficha de anamnese na mesma tela.',
    '• Lembrete de WhatsApp: Geração automatizada de links de confirmação com mensagens pré-formatadas.',
    '• Estatísticas Inteligentes: Dashboard com análise semanal de atendimentos e distribuição de consultas.',
    '• Inteligência Artificial (DeepSeek/OpenRouter): Ferramentas de transcrição por voz, refinamento de prontuário, sugestão de exercícios e parecer de evolução.'
  ]

  bulletsSection1.forEach(bullet => {
    doc
      .fillColor(textColor)
      .font('Helvetica')
      .fontSize(10)
      .text(bullet, { paragraphGap: 5, indent: 15 })
  })

  doc.moveDown(1.5)

  // ------------------ SEÇÃO 2: DASHBOARD ------------------
  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(18)
    .text('2. Painel de Controle (Dashboard)')
    .moveDown(0.5)

  doc
    .fillColor(textColor)
    .font('Helvetica')
    .fontSize(10.5)
    .text(
      'Ao abrir o aplicativo, o Dashboard fornece uma visão panorâmica dos seus indicadores clínicos e de agenda. Ele é atualizado em tempo real à medida que novos pacientes e agendamentos são registrados no banco de dados.',
      { align: 'justify' }
    )
    .moveDown(0.8)

  doc
    .fillColor(secondaryColor)
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('Componentes do Dashboard:')
    .moveDown(0.4)

  const bulletsSection2 = [
    '• Cards de Estatísticas: Indicadores do total de pacientes, consultas na semana, pacientes ativos e tratamentos finalizados.',
    '• Alertas Clínicos: Um painel inteligente que avisa no topo do Dashboard se hoje é aniversário de algum paciente ou se ele já atingiu o limite estimado de sessões.',
    '• Gráfico - Consultas da Semana: Exibe visualmente a quantidade de sessões domiciliares agendadas para cada dia da semana corrente (de Segunda a Sábado).',
    '• Gráfico - Distribuição de Consultas: Mapeamento percentual de atendimentos pelas categorias Terapia, Avaliação e Retorno.'
  ]

  bulletsSection2.forEach(bullet => {
    doc
      .fillColor(textColor)
      .font('Helvetica')
      .fontSize(10)
      .text(bullet, { paragraphGap: 5, indent: 15 })
  })

  // ------------------ PÁGINA 2: GESTÃO E AGENDA ------------------
  doc.addPage()

  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(18)
    .text('3. Cadastro e Gestão de Pacientes')
    .moveDown(0.5)

  doc
    .fillColor(textColor)
    .font('Helvetica')
    .fontSize(10.5)
    .text(
      'A tela de Pacientes permite gerenciar toda a sua lista de clientes e acessar os prontuários de atendimento.',
      { align: 'justify' }
    )
    .moveDown(0.8)

  doc
    .fillColor(secondaryColor)
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('Como realizar as ações:')
    .moveDown(0.4)

  const bulletsSection3 = [
    '• Cadastrar Paciente: Clique no botão "+ Novo Paciente". Insira o nome, responsável (se for criança), endereço do atendimento domiciliar, telefone, data de nascimento, total de sessões estimadas e sessões por semana.',
    '• Editar Paciente: Na tabela, clique no botão "Editar" na linha do paciente desejado para atualizar informações de contato ou renovar o pacote de sessões.',
    '• Excluir Paciente: Clique no botão vermelho "Excluir". Confirme na mensagem do navegador. O paciente e todo o seu histórico serão removidos do sistema.'
  ]

  bulletsSection3.forEach(bullet => {
    doc
      .fillColor(textColor)
      .font('Helvetica')
      .fontSize(10)
      .text(bullet, { paragraphGap: 5, indent: 15 })
  })

  doc.moveDown(1.5)

  // ------------------ SEÇÃO 4: AGENDA ------------------
  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(18)
    .text('4. Agenda & Confirmação por WhatsApp')
    .moveDown(0.5)

  doc
    .fillColor(textColor)
    .font('Helvetica')
    .fontSize(10.5)
    .text(
      'A Agenda organiza os seus atendimentos domiciliares em ordem cronológica de data e hora.',
      { align: 'justify' }
    )
    .moveDown(0.8)

  doc
    .fillColor(secondaryColor)
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('Como utilizar a confirmação automatizada:')
    .moveDown(0.4)

  const bulletsSection4 = [
    '1. Na aba Agenda, clique em "+ Novo Agendamento" para registrar um dia e hora de atendimento domiciliar.',
    '2. Em cada card de agendamento na lista, você verá um botão verde "Lembrete 💬".',
    '3. Clique no botão. O FonoFlow abrirá automaticamente o WhatsApp com a mensagem formatada para o paciente:'
  ]

  bulletsSection4.forEach(bullet => {
    doc
      .fillColor(textColor)
      .font('Helvetica')
      .fontSize(10)
      .text(bullet, { paragraphGap: 5, indent: 15 })
  })

  doc.moveDown(0.5)

  // Exemplo de Mensagem Box
  const boxX = doc.x
  const boxY = doc.y
  doc
    .rect(boxX, boxY, 504, 45)
    .fillColor('#F3F4F6')
    .fill()

  doc
    .fillColor('#374151')
    .font('Helvetica-Oblique')
    .fontSize(9.5)
    .text(
      '"Olá! Confirmamos o atendimento domiciliar de [Nome do Paciente] no dia [Data] às [Hora]. Estarei aí no horário combinado!"',
      boxX + 15,
      boxY + 15,
      { width: 474 }
    )

  // ------------------ PÁGINA 3: PRONTUÁRIOS E IA ------------------
  doc.addPage()

  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(18)
    .text('5. Prontuários e Recursos de Inteligência Artificial')
    .moveDown(0.5)

  doc
    .fillColor(textColor)
    .font('Helvetica')
    .fontSize(10.5)
    .text(
      'O prontuário é acessado clicando em "Evolução" na linha do paciente (tela de Pacientes). Ele é dividido em duas abas principais:',
      { align: 'justify' }
    )
    .moveDown(0.8)

  doc
    .fillColor(secondaryColor)
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('Aba 1: Histórico e Evoluções Clínicas')
    .moveDown(0.4)

  const bulletsSection5_1 = [
    '• Ditado por Voz 🎙️ (Fase 1): Clique no botão "Ditar 🎙️". Fale o que aconteceu na sessão. A voz é transcrita em tempo real no campo de anotações.',
    '• Melhorar Notas ✨ (Fase 2): Digite anotações simples e rápidas (ex: "sopro bom, treinou R") e clique em "Melhorar notas ✨". A IA do DeepSeek reescreverá o texto no padrão clínico formal ideal.',
    '• Análise de Progresso com IA 📈 (Fase 4): Acima da lista do histórico de sessões, clique em "Análise com IA 📈". O DeepSeek/OpenRouter lerá todo o histórico de evoluções e gerará um parecer clínico estruturado sobre os avanços obtidos pelo paciente.'
  ]

  bulletsSection5_1.forEach(bullet => {
    doc
      .fillColor(textColor)
      .font('Helvetica')
      .fontSize(10)
      .text(bullet, { paragraphGap: 5, indent: 15 })
  })

  doc.moveDown(0.8)

  doc
    .fillColor(secondaryColor)
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('Aba 2: Avaliação e Anamnese')
    .moveDown(0.4)

  const bulletsSection5_2 = [
    '• Sugerir Exercícios com IA 🎯 (Fase 3): Digite a queixa do paciente e clique em "Sugerir Exercícios com IA 🎯". A IA gerará propostas de atividades lúdicas sob medida com base na queixa e na idade do paciente.'
  ]

  bulletsSection5_2.forEach(bullet => {
    doc
      .fillColor(textColor)
      .font('Helvetica')
      .fontSize(10)
      .text(bullet, { paragraphGap: 5, indent: 15 })
  })

  doc.moveDown(1.5)

  // ------------------ SEÇÃO 6: EXPORTAÇÃO ------------------
  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(18)
    .text('6. Impressão de Prontuário em PDF')
    .moveDown(0.5)

  const bulletsSection6 = [
    '• Ela organiza de forma estruturada os dados cadastrais, a anamnese de avaliação e todo o histórico de evoluções em ordem cronológica.',
    '• A página foi programada para impressão física em formato A4, incluindo espaço para carimbo e assinatura do profissional.',
    '• Você pode salvar o arquivo como PDF utilizando a opção nativa de impressão do navegador (Salvar como PDF).'
  ]

  bulletsSection6.forEach(bullet => {
    doc
      .fillColor(textColor)
      .font('Helvetica')
      .fontSize(10)
      .text(bullet, { paragraphGap: 5, indent: 15 })
  })

  doc.end()
  console.log('PDF gerado com sucesso em: ' + pdfPath)
}

generatePDF()
