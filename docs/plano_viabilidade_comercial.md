# Relatório de Viabilidade Comercial - FonoFlow 🚀

Este documento apresenta uma análise profunda e estruturada de todos os requisitos pendentes nas esferas **Legal**, **Arquitetura**, **Técnica** e **Design** para transformar o FonoFlow de um MVP (Produto Mínimo Viável) em um produto de software comercializável sob o modelo **SaaS (Software as a Service)** com planos de assinatura recorrente.

---

## ⚖️ 1. Requisitos Legais e de Conformidade

Lidar com dados de saúde (anamneses, pareceres de progresso e prontuários) exige o nível máximo de conformidade legal no Brasil, dado o caráter altamente sensível das informações.

### A. Lei Geral de Proteção de Dados (LGPD)
Os prontuários e anamneses entram na categoria de **"Dados Pessoais Sensíveis"** (Artigo 5º, II da LGPD).
- **Termo de Consentimento Livre e Esclarecido (TCLE)**: Implementar uma tela obrigatória onde os pacientes (ou seus responsáveis legais, em caso de menores) deem consentimento explícito para a guarda eletrônica dos dados clínicos.
- **Revogação e Exportação de Dados**: Criar uma ferramenta para exportação completa das informações de um paciente (direito à portabilidade) e exclusão definitiva caso solicitado (direito ao esquecimento).
- **Controle de Acesso Fino (Audit Log)**: Manter um registro inalterável de auditoria indicando *quem* acessou cada prontuário, em *qual data* e *qual horário*. Isso é exigido para comprovar conformidade em caso de vazamento.

### B. Regulamentações dos Conselhos Profissionais (CFFa / CREFONO)
Os conselhos regionais e federais de fonoaudiologia exigem rigor ético no tratamento de dados dos pacientes.
- **Guarda e Temporalidade do Prontuário**: A legislação de saúde brasileira exige que prontuários clínicos sejam mantidos por um período mínimo de **20 anos** a partir do último registro. O plano de banco de dados deve garantir essa persistência a longo prazo.
- **Sigilo Profissional**: Termos de Uso claros que estipulem a responsabilidade do profissional de manter suas senhas pessoais e acessos ao FonoFlow seguros.

---

## 🏛️ 2. Arquitetura Multi-Tenant (Multi-Inquilino)

Atualmente, o FonoFlow filtra documentos do Firebase usando regras associadas ao `userId` do profissional logado. Para se tornar comercializável em larga escala, precisamos evoluir a arquitetura para isolar diferentes clínicas e profissionais.

### A. Isolamento por Inquilino (Tenant Isolation)
- **Tenant ID**: Adicionar a entidade "Tenant" (ex: Clínica X, Consultório Y) no banco de dados. Todos os usuários (profissionais, secretárias) e dados de pacientes devem estar vinculados a esse Tenant ID.
- **Permissões Multiusuário**: Permitir que uma fonoaudióloga administradora possa convidar outras fonoaudiólogas ou secretárias para operarem sob a mesma conta de clínica, restringindo acessos conforme o cargo.

### B. Gestão de Cotas e Limitação de Recursos
Para diferenciar os planos de assinatura, a arquitetura deve validar limites em tempo real antes das gravações:
- **Limite de Pacientes Ativos**: Plano Básico (hasta 15 pacientes), Plano Intermediário (até 50 pacientes), Plano Premium (ilimitado).
- **Limitação de Chamadas de IA**: Restringir o número de melhorias de notas e análises automáticas por mês de acordo com o plano para evitar abusos na API Key.

---

## 🔌 3. Requisitos Técnicos e Funcionais

### A. Gateway de Pagamento e Faturamento Recorrente
- **Integração de Assinaturas (Stripe ou ASAAS)**: Integrar um gateway com forte presença no mercado brasileiro. O **ASAAS** é altamente recomendado devido ao custo competitivo e automação robusta de cobrança via **Pix Recorrente** e **Boleto**, além do **Cartão de Crédito**.
- **Painel de Faturamento (Billing Portal)**: Página interna onde o usuário pode ver o histórico de notas fiscais, alterar o cartão cadastrado, fazer upgrade/downgrade de plano ou cancelar a assinatura.
- **Bloqueio Automático por Inadimplência**: Implementar um webhook do gateway que sinalize falha de pagamento, bloqueando de forma elegante o acesso do usuário e liberando-o imediatamente após a liquidação da fatura.

### B. Segurança e Infraestrutura de Produção
- **Criptografia dos Prontuários (Data at Rest)**: Criptografar os campos de texto sensíveis (como anamnese e evoluções) antes de enviar ao Firestore. Se o banco de dados for comprometido, os dados clínicos continuam indecifráveis.
- **Políticas de Backup e Disaster Recovery**: Configurar backups automáticos diários do Cloud Firestore salvos em um bucket seguro e redundante (ex: AWS S3 ou Google Cloud Storage).

### C. Gestão e Custos de Inteligência Artificial
As ferramentas baseadas no DeepSeek possuem custo por caractere consumido.
- **Proxy de IA com Rate Limiting**: Encaminhar as requisições de IA através de uma nuvem serverless própria que implemente limites rígidos de uso por hora/dia por usuário, impedindo que robôs gastem suas chaves.
- **Modelo Próprio de Créditos**: Opcionalmente, cobrar um valor extra ou criar "créditos mensais de IA" que o usuário pode recarregar caso precise realizar muitas análises clínicas adicionais.

---

## 🎨 4. Design, Experiência de Uso (UX) e Acessibilidade

Para competir em alto nível no mercado nacional de SaaS, o design deve passar de "organizado" para "extremamente profissional".

### A. Acessibilidade (WCAG)
Fonoaudiólogos operam o sistema sob grande pressão de tempo no dia a dia.
- **Modo de Alto Contraste**: Garantir conformidade com as diretrizes WCAG (contraste mínimo de 4.5:1 para textos em relação ao fundo), facilitando o uso sob sol forte ou luz artificial baixa no atendimento domiciliar.
- **Navegação Inteligente via Teclado e Leitor de Tela**: Incluir suporte completo a acessibilidade sonora (tags `aria-label` corretas) em modais como o de Ditado Clínico.

### B. Refinamento de UX
- **Offline-First com Indicador Visual**: Adicionar um pequeno badge de status de sincronização (ex: *"Sincronizado"*, *"Sincronizando..."* ou *"Offline - Suas alterações serão salvas assim que conectar"*). Isso dá segurança ao profissional que atende em regiões sem sinal de internet.
- **Fluxo de Onboarding Guiado**: Um tour interativo para novos assinantes quando fizerem o primeiro login, ensinando-os a cadastrar o primeiro paciente e realizar o primeiro agendamento.
