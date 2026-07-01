# 🔥 Guia de Configuração do Firebase

## Status Atual

✅ Credenciais do Firebase configuradas  
❌ **Firebase Authentication precisa ser habilitado**  
❌ **Firestore Database precisa ser configurado**

---

## 🎯 Passo a Passo - Configuração Obrigatória

### 1. Acessar o Console do Firebase

1. Acesse: https://console.firebase.google.com/
2. Selecione seu projeto: **fonoanalytics-92ef2**

---

### 2. Habilitar Firebase Authentication

1. No menu lateral esquerdo, clique em **"Authentication"** (Autenticação)
2. Clique no botão **"Get started"** (Começar) ou **"Iniciar"**
3. Na aba **"Sign-in method"** (Método de login), procure por **"Email/Password"**
4. Clique em **"Email/Password"**
5. **Ative o primeiro switch** (Email/Password)
   - ⚠️ NÃO ative o "Email link" (segundo switch), apenas o primeiro
6. Clique em **"Save"** (Salvar)

✅ **Pronto!** O Authentication está habilitado.

---

### 3. Criar o Firestore Database

1. No menu lateral esquerdo, clique em **"Firestore Database"**
2. Clique no botão **"Create database"** (Criar banco de dados)
3. **Escolha o modo**:
   - Selecione **"Start in production mode"** (Iniciar em modo de produção)
   - Clique em **"Next"** (Próximo)
4. **Escolha a localização**:
   - Recomendado para Brasil: **`southamerica-east1 (São Paulo)`**
   - Se não estiver disponível, escolha: **`us-east1`** ou outra próxima
   - Clique em **"Enable"** (Ativar)

⏳ Aguarde alguns segundos enquanto o Firestore é criado...

✅ **Banco de dados criado com sucesso!**

---

### 4. Configurar Regras de Segurança do Firestore

**Importante:** As regras de segurança garantem que cada profissional acesse apenas os dados de seus próprios pacientes.

1. Ainda na tela do **Firestore Database**, clique na aba **"Rules"** (Regras)
2. **Substitua todo o conteúdo** pelas regras abaixo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /patients/{patientId} {
      allow read, delete: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null &&
        resource.data.userId == request.auth.uid &&
        request.resource.data.userId == request.auth.uid;
    }
  }
}
```

3. Clique em **"Publish"** (Publicar)

✅ **Regras de segurança configuradas!**

---

## 🧪 Testar a Aplicação

Após concluir TODAS as etapas acima:

1. Volte para o navegador onde está rodando a aplicação
2. Atualize a página (F5)
3. Tente criar uma nova conta de usuário
4. O cadastro agora deve funcionar perfeitamente! 🎉

---

## 🚀 Próximos Passos (Após Testar)

Quando a aplicação estiver funcionando localmente, você poderá:

1. **Deploy no Vercel** (instruções serão fornecidas)
2. **Adicionar domínio personalizado** (opcional)
3. **Implementar as próximas fases** (Agenda, Histórico Clínico, etc.)

---

## 🆘 Problemas Comuns

### "Não foi possível criar a conta"
- ✅ Verifique se habilitou Email/Password no Authentication
- ✅ Verifique se criou o Firestore Database
- ✅ Verifique se publicou as regras de segurança

### "Permission denied" ao criar paciente
- ✅ Verifique se as regras do Firestore foram publicadas corretamente
- ✅ Certifique-se de que está logado na aplicação

### Erros 403 ou 400
- ✅ Limpe o cache do navegador (Ctrl+Shift+Delete)
- ✅ Atualize a página (F5)
- ✅ Faça logout e login novamente

---

## 📞 Suporte

Se encontrar dificuldades, me avise! Estou aqui para ajudar. 😊
