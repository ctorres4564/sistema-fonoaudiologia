# Guia do Usuário - FonoFlow 📖

O **FonoFlow** é um sistema inteligente de fonoaudiologia voltado para o acompanhamento e gestão clínica de atendimentos domiciliares (home care). Este guia ensina como operar o painel de controle, agenda, prontuários e recursos de Inteligência Artificial do sistema.

---

## 🚀 Como acessar e navegar

Acesse o sistema pelo link de produção:
🔗 **[https://fonoflow.vercel.app](https://fonoflow.vercel.app)**

No menu lateral esquerdo, você encontrará as abas para as seções principais:
*   **Dashboard**: Resumo dos seus indicadores, aniversariantes do dia, alertas e gráficos estatísticos semanais.
*   **Pacientes**: Cadastro geral dos seus clientes e acesso à ficha de prontuário e anamnese.
*   **Agenda**: Lista cronológica de sessões e disparador de confirmações no WhatsApp.

---

## 📊 1. Painel de Controle (Dashboard)

O painel inicial resume o seu volume de trabalho e fornece insights automáticos:
*   **Cards de Estatísticas**: Exibem a quantidade de pacientes cadastrados, sessões estimadas para a semana e status de tratamentos.
*   **Alertas Clínicos**: Notificações automáticas caso algum paciente faça aniversário hoje ou se ele já atingiu o limite estimado de sessões contratadas.
*   **Consultas da Semana (Gráfico 1)**: Um gráfico de barras que consolida quantos atendimentos você tem marcados em cada dia da semana (de Segunda a Sábado).
*   **Distribuição de Consultas (Gráfico 2)**: Proporção e porcentagem em tempo real de sessões agendadas divididas por *Terapia*, *Avaliação* ou *Retorno*.

---

## 👥 2. Gestão de Pacientes

Na aba **Pacientes**, você gerencia as pessoas sob seus cuidados:
*   **Cadastrar**: Clique em `+ Novo Paciente` e preencha as informações obrigatórias (nome, telefone, endereço de atendimento domiciliar, sessões semanais e totais contratadas).
*   **Editar**: Clique em `Editar` na linha do paciente correspondente para atualizar informações de contato, reajustar endereço ou renovar pacotes de sessões.
*   **Excluir**: Clique em `Excluir` (vermelho) para remover permanentemente o paciente e todos os seus históricos associados.

---

## 📅 3. Agenda & Lembretes no WhatsApp

A aba **Agenda** organiza a rotina de visitas domiciliares de forma cronológica:
1.  Clique em `+ Novo Agendamento` para marcar o paciente, data e hora da sessão.
2.  No card do agendamento, clique no botão verde **Lembrete 💬**.
3.  O sistema abrirá automaticamente o WhatsApp Web ou o aplicativo do WhatsApp do seu celular com a mensagem adaptada para home care:
    > *"Olá! Confirmamos o atendimento domiciliar de [Nome do Paciente] no dia [Data] às [Hora]. Estarei aí no horário combinado!"*

---

## 📝 4. Prontuário e Inteligência Artificial (DeepSeek)

Na aba **Pacientes**, ao clicar em **Evolução** na linha de um paciente, o modal de prontuário com duas abas é aberto:

### Aba de Histórico e Evoluções Clínicas
*   **Ditado por Voz 🎙️**: Clique em **Ditar 🎙️**. Fale o progresso da sessão. O sistema transcreve a sua fala em tempo real para o campo de anotações (100% nativo e gratuito).
*   **Melhorar Notas ✨**: Digite anotações simples e rápidas (ex: *"treinamos sopro, cansou na metade"*) e clique em **Melhorar notas ✨**. A IA do DeepSeek reescreverá a evolução clínica no padrão técnico formal fonoaudiológico.
*   **Análise de Progresso com IA 📈**: Clique no botão no canto do histórico. O DeepSeek lerá todas as sessões anteriores do prontuário do paciente e gerará um Parecer de Progresso completo, sugerindo condutas clínicas.

### Aba de Avaliação e Anamnese
*   **Sugerir Exercícios com IA 🎯**: Preencha a queixa inicial do paciente e clique em **Sugerir Exercícios com IA 🎯**. A IA analisará a idade do paciente e a queixa informada para sugerir uma lista de exercícios práticos e lúdicos para fazer em casa.

---

## 🖨️ 5. Impressão de Prontuário em PDF

No cabeçalho do Prontuário Clínico de cada paciente, há o botão **Imprimir Prontuário 🖨️**:
1.  Clique no botão para abrir uma página limpa formatada para folha A4.
2.  A página compila o cadastro do paciente, a Anamnese de Avaliação completa e todo o histórico de sessões em ordem cronológica com campo para assinatura.
3.  Use o comando de impressão do seu navegador (`Ctrl + P`) e selecione a opção **Salvar como PDF** para gerar e compartilhar o documento.
