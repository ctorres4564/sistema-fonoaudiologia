import os
import sys

def install_and_import():
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    except ImportError:
        import subprocess
        print("Instalando reportlab...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "reportlab"])
        print("reportlab instalado com sucesso!")

install_and_import()

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_pdf():
    pdf_path = os.path.join("c:\\fonoflow", "docs", "Guia_do_Usuario_FonoFlow.pdf")
    
    # Garantir que a pasta docs existe
    os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
    
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Estilos customizados elegantes
    primary_color = colors.HexColor("#4C1D95") # Plum 900/800
    secondary_color = colors.HexColor("#D97706") # Gold 600
    text_color = colors.HexColor("#1F2937") # Neutral 800
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=primary_color,
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#4B5563"),
        spaceAfter=30
    )
    
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=primary_color,
        spaceBefore=15,
        spaceAfter=10,
        keepWithNext=True
    )
    
    subheading_style = ParagraphStyle(
        'SubSectionHeading',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=secondary_color,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=15,
        textColor=text_color,
        spaceAfter=10
    )
    
    bullet_style = ParagraphStyle(
        'DocBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=text_color,
        leftIndent=20,
        firstLineIndent=-10,
        spaceAfter=6
    )
    
    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#374151")
    )
    
    story = []
    
    # ------------------ CAPA ------------------
    story.append(Spacer(1, 40))
    story.append(Paragraph("FonoFlow", title_style))
    story.append(Paragraph("Manual e Guia de Uso Completo do Usuário", ParagraphStyle('CoverSub', parent=title_style, fontSize=16, textColor=secondary_color)))
    story.append(Paragraph("Sistema Inteligente de Gestão de Pacientes e Atendimento Fonoaudiológico Domiciliar", subtitle_style))
    story.append(Spacer(1, 60))
    
    # Tabela com metadados na capa
    meta_data = [
        [Paragraph("<b>Versão:</b> 1.1", body_style), Paragraph("<b>Autor:</b> Antigravity AI", body_style)],
        [Paragraph("<b>Ambiente:</b> Vercel Production", body_style), Paragraph("<b>Banco de Dados:</b> Cloud Firestore", body_style)],
        [Paragraph("<b>Plataforma:</b> Web (Desktop & Mobile)", body_style), Paragraph("<b>Data de Geração:</b> Julho de 2026", body_style)]
    ]
    meta_table = Table(meta_data, colWidths=[250, 250])
    meta_table.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor("#E5E7EB")),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(meta_table)
    
    story.append(PageBreak())
    
    # ------------------ SEÇÃO 1: INTRODUÇÃO ------------------
    story.append(Paragraph("1. Introdução ao FonoFlow", heading_style))
    story.append(Paragraph(
        "O <b>FonoFlow</b> é uma plataforma web premium sob medida para fonoaudiólogos, focada no fluxo de trabalho de <b>atendimento domiciliar (home care)</b>. O sistema foi projetado para ser leve, rápido, responsivo (com perfeito funcionamento em smartphones e tablets) e possui integração direta com Inteligência Artificial para otimizar o registro de prontuários.",
        body_style
    ))
    story.append(Paragraph("Principais Diferenciais:", subheading_style))
    story.append(Paragraph("• <b>Atendimento Domiciliar:</b> Textos e mensagens adaptados à realidade de fonoaudiologia home care.", bullet_style))
    story.append(Paragraph("• <b>Prontuário de Duas Abas:</b> Histórico cronológico de evoluções e ficha de anamnese na mesma tela.", bullet_style))
    story.append(Paragraph("• <b>Lembrete de WhatsApp:</b> Geração automatizada de links de confirmação com mensagens pré-formatadas.", bullet_style))
    story.append(Paragraph("• <b>Estatísticas Inteligentes:</b> Dashboard com análise semanal de atendimentos e distribuição de consultas.", bullet_style))
    story.append(Paragraph("• <b>Inteligência Artificial (DeepSeek/OpenRouter):</b> Ferramentas de transcrição por voz, refinamento de prontuário, sugestão de exercícios e parecer de evolução.", bullet_style))
    
    story.append(Spacer(1, 15))
    
    # ------------------ SEÇÃO 2: DASHBOARD & INDICADORES ------------------
    story.append(Paragraph("2. Painel de Controle (Dashboard)", heading_style))
    story.append(Paragraph(
        "Ao abrir o aplicativo, o Dashboard fornece uma visão panorâmica dos seus indicadores clínicos e de agenda. Ele é atualizado em tempo real à medida que novos pacientes e agendamentos são registrados no banco de dados.",
        body_style
    ))
    story.append(Paragraph("<b>Componentes do Dashboard:</b>", subheading_style))
    story.append(Paragraph("• <b>Cards de Estatísticas:</b> Indicadores do total de pacientes, consultas na semana, pacientes ativos e tratamentos finalizados.", bullet_style))
    story.append(Paragraph("• <b>Alertas Clínicos:</b> Um painel inteligente que avisa no topo do Dashboard se hoje é aniversário de algum paciente ou se ele já atingiu o limite contratado/estimado de sessões.", bullet_style))
    story.append(Paragraph("• <b>Gráfico - Consultas da Semana:</b> Exibe visualmente a quantidade de sessões domiciliares agendadas para cada dia da semana corrente (de Segunda a Sábado).", bullet_style))
    story.append(Paragraph("• <b>Gráfico - Distribuição de Consultas:</b> Mapeamento percentual de atendimentos pelas categorias <i>Terapia</i>, <i>Avaliação</i> e <i>Retorno</i>.", bullet_style))
    
    story.append(PageBreak())
    
    # ------------------ SEÇÃO 3: GESTÃO DE PACIENTES ------------------
    story.append(Paragraph("3. Cadastro e Gestão de Pacientes", heading_style))
    story.append(Paragraph(
        "A tela de Pacientes permite gerenciar toda a sua lista de clientes e acessar os prontuários de atendimento.",
        body_style
    ))
    story.append(Paragraph("Como realizar as ações:", subheading_style))
    story.append(Paragraph("• <b>Cadastrar Paciente:</b> Clique no botão <b>+ Novo Paciente</b>. Insira o nome, responsável (se for criança), endereço do atendimento domiciliar, telefone, data de nascimento, total de sessões estimadas e sessões por semana.", bullet_style))
    story.append(Paragraph("• <b>Editar Paciente:</b> Na tabela, clique no botão <b>Editar</b> na linha do paciente desejado para atualizar informações de contato ou renovar o pacote de sessões.", bullet_style))
    story.append(Paragraph("• <b>Excluir Paciente:</b> Clique no botão vermelho <b>Excluir</b>. Confirme na mensagem do navegador. O paciente e todo o seu histórico serão removidos do sistema.", bullet_style))
    
    story.append(Spacer(1, 15))
    
    # ------------------ SEÇÃO 4: AGENDA E WHATSAPP ------------------
    story.append(Paragraph("4. Agenda & Confirmação por WhatsApp", heading_style))
    story.append(Paragraph(
        "A Agenda organiza os seus atendimentos domiciliares em ordem cronológica de data e hora.",
        body_style
    ))
    story.append(Paragraph("Como utilizar a confirmação automatizada:", subheading_style))
    story.append(Paragraph("1. Na aba <b>Agenda</b>, clique em <b>+ Novo Agendamento</b> para registrar um dia e hora de atendimento domiciliar.", bullet_style))
    story.append(Paragraph("2. Em cada card de agendamento na lista, você verá um botão verde <b>Lembrete 💬</b>.", bullet_style))
    story.append(Paragraph("3. Clique no botão. O FonoFlow abrirá automaticamente o WhatsApp com a mensagem formatada para o paciente:", bullet_style))
    
    # Exemplo de Mensagem Box
    msg_box_data = [[
        Paragraph("<i>\"Olá! Confirmamos o atendimento domiciliar de [Nome do Paciente] no dia [Data] às [Hora]. Estarei aí no horário combinado!\"</i>", callout_style)
    ]]
    msg_table = Table(msg_box_data, colWidths=[450])
    msg_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F3F4F6")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#E5E7EB")),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(Spacer(1, 5))
    story.append(msg_table)
    story.append(Spacer(1, 10))
    
    story.append(PageBreak())
    
    # ------------------ SEÇÃO 5: PRONTUÁRIOS E IA ------------------
    story.append(Paragraph("5. Prontuários e Recursos de Inteligência Artificial", heading_style))
    story.append(Paragraph(
        "O prontuário é acessado clicando em <b>Evolução</b> na linha do paciente (tela de Pacientes). Ele é dividido em duas abas principais:",
        body_style
    ))
    story.append(Paragraph("Aba 1: Histórico e Evoluções Clínicas", subheading_style))
    story.append(Paragraph(
        "Aqui você registra o progresso de cada sessão. Nesta aba, implementamos duas ferramentas de Inteligência Artificial:",
        body_style
    ))
    story.append(Paragraph("• <b>Ditado por Voz 🎙️ (Fase 1):</b> Clique no botão <b>Ditar 🎙️</b>. Fale o que aconteceu na sessão. A voz é transcrita em tempo real no campo de anotações.", bullet_style))
    story.append(Paragraph("• <b>Melhorar Notas ✨ (Fase 2):</b> Digite anotações simples e rápidas (ex: <i>'sopro bom, treinou R'</i>) e clique em <b>Melhorar notas ✨</b>. A IA do DeepSeek reescreverá o texto no padrão clínico formal ideal.", bullet_style))
    story.append(Paragraph("• <b>Análise de Progresso com IA 📈 (Fase 4):</b> Acima da lista do histórico de sessões, clique em <b>Análise com IA 📈</b>. O DeepSeek lerá todo o histórico de evoluções e gerará um parecer clínico estruturado sobre os avanços obtidos pelo paciente.", bullet_style))
    
    story.append(Paragraph("Aba 2: Avaliação e Anamnese", subheading_style))
    story.append(Paragraph(
        "Para registrar as queixas iniciais e marcos de desenvolvimento. Possui uma ferramenta de suporte clínico de IA:",
        body_style
    ))
    story.append(Paragraph("• <b>Sugerir Exercícios com IA 🎯 (Fase 3):</b> Digite a queixa do paciente e clique em <b>Sugerir Exercícios com IA 🎯</b>. A IA gerará propostas de atividades lúdicas sob medida com base na queixa e na idade do paciente.", bullet_style))
    
    story.append(Spacer(1, 15))
    
    # ------------------ SEÇÃO 6: EXPORTAÇÃO E IMPRESSÃO ------------------
    story.append(Paragraph("6. Impressão de Prontuário em PDF", heading_style))
    story.append(Paragraph(
        "No cabeçalho do Prontuário, ao clicar no botão <b>Imprimir Prontuário 🖨️</b>, uma nova página limpa e formatada é aberta.",
        body_style
    ))
    story.append(Paragraph("• Ela organiza de forma estruturada os dados cadastrais, a anamnese de avaliação e todo o histórico de evoluções em ordem cronológica.", bullet_style))
    story.append(Paragraph("• A página foi programada para impressão física em formato <b>A4</b>, incluindo espaço para carimbo e assinatura do profissional.", bullet_style))
    story.append(Paragraph("• Você pode salvar o arquivo como PDF utilizando a opção nativa de impressão do navegador (<i>Salvar como PDF</i>).", bullet_style))
    
    # Concluir
    doc.build(story)
    print("PDF Guia do Usuário gerado com sucesso!")

if __name__ == "__main__":
    generate_pdf()
