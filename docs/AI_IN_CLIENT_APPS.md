# 🤖 IA nos Apps dos Clientes - Guia Completo

## 📋 Visão Geral

A partir de agora, **os apps criados pelos nossos usuários podem ter IA integrada**! Isso significa que seus clientes finais podem interagir com inteligência artificial diretamente nos apps criados na plataforma.

### Casos de Uso

- 🏥 **Clínicas**: Triagem automática de sintomas, chatbot para dúvidas
- 🛒 **E-commerce**: Recomendações personalizadas, atendimento virtual
- 📚 **Educação**: Tutores virtuais, correção automática
- 💼 **Negócios**: Análise de documentos, assistentes virtuais
- 🎨 **Criativo**: Geração de conteúdo, sugestões inteligentes

---

## 🎯 Componentes de IA Disponíveis

### 1. UIAIChat - Chatbot Interativo

Cria um chatbot completo com histórico de conversas.

```json
{
  "type": "aichat",
  "id": "chatbot",
  "persona": "Você é um assistente médico prestativo",
  "welcomeMessage": "Olá! Como posso ajudar?",
  "placeholder": "Digite sua mensagem...",
  "height": 500,
  "showHistory": true,
  "maxMessages": 50
}
```

**Propriedades:**
- `persona` (opcional): Define a personalidade e contexto da IA
- `welcomeMessage` (opcional): Mensagem inicial do chatbot
- `placeholder` (opcional): Texto do campo de entrada
- `height` (opcional): Altura do componente em pixels
- `showHistory` (opcional): Se deve manter histórico de conversas
- `maxMessages` (opcional): Número máximo de mensagens armazenadas

**Exemplo Real - Clínica:**
```json
{
  "type": "aichat",
  "id": "assistente-clinica",
  "persona": "Você é um assistente de clínica médica. Responda sobre:\n- Horários: Segunda a Sexta 8h-18h\n- Especialidades: Cardiologia, Dermatologia, Pediatria\n- Convênios aceitos\n- Localização e contato",
  "welcomeMessage": "Olá! Sou o assistente da Clínica Saúde Total. Como posso ajudá-lo?",
  "height": 600
}
```

---

### 2. UIAIAssistant - Assistente com Um Clique

Executa análise de IA com base em campos do formulário.

```json
{
  "type": "aiassistant",
  "id": "ai-helper",
  "prompt": "Analise os sintomas: {{sintomas}} e sugira uma especialidade",
  "inputFields": ["sintomas", "idade"],
  "outputField": "sugestao",
  "buttonText": "Obter Sugestão da IA",
  "loadingText": "Analisando...",
  "icon": "sparkles"
}
```

**Propriedades:**
- `prompt` (obrigatório): Template do prompt (use `{{fieldId}}` para referenciar campos)
- `inputFields` (obrigatório): Array de IDs de campos do formulário
- `outputField` (obrigatório): ID do campo onde salvar o resultado
- `buttonText` (opcional): Texto do botão
- `loadingText` (opcional): Texto durante processamento
- `icon` (opcional): Ícone do botão

**Exemplo Real - Triagem Médica:**
```json
{
  "type": "aiassistant",
  "id": "triagem-ia",
  "prompt": "Paciente de {{idade}} anos com sintomas: {{sintomas}}. Sugira a especialidade médica mais adequada e explique o motivo.",
  "inputFields": ["sintomas", "idade"],
  "outputField": "especialidadeSugerida",
  "buttonText": "🔍 Analisar Sintomas",
  "loadingText": "Analisando com IA..."
}
```

---

### 3. UIAIAnalyzer - Análise Automática

Analisa texto automaticamente (sentimento, categoria, resumo).

```json
{
  "type": "aianalyzer",
  "id": "sentiment",
  "analyzeType": "sentiment",
  "sourceField": "feedback",
  "resultField": "sentimento",
  "autoAnalyze": true
}
```

**Propriedades:**
- `analyzeType`: `"text"` | `"sentiment"` | `"category"` | `"summary"`
- `sourceField` (obrigatório): Campo a ser analisado
- `resultField` (obrigatório): Campo para salvar resultado
- `autoAnalyze` (opcional): Analisar automaticamente ao digitar
- `placeholder` (opcional): Texto durante análise

**Tipos de Análise:**
- `sentiment`: POSITIVO, NEGATIVO ou NEUTRO
- `category`: Classificação em categorias
- `summary`: Resumo em uma frase
- `text`: Análise geral de texto

**Exemplo Real - Análise de Feedback:**
```json
{
  "type": "aianalyzer",
  "id": "analisar-feedback",
  "analyzeType": "sentiment",
  "sourceField": "comentario",
  "resultField": "sentimento",
  "autoAnalyze": true
}
```

---

## 🔧 Ação de IA em Botões

Você também pode adicionar IA a botões existentes:

```json
{
  "type": "button",
  "text": "Analisar com IA",
  "action": {
    "type": "ai",
    "aiAction": "suggest",
    "prompt": "Baseado em {{dados}}, forneça uma sugestão",
    "context": {
      "campo1": "valor1"
    },
    "saveToField": "resultado",
    "persona": "Você é um consultor especializado",
    "onSuccess": {
      "type": "popup",
      "message": "Análise concluída!"
    }
  }
}
```

**Tipos de aiAction:**
- `chat`: Conversa natural
- `analyze`: Análise de dados
- `suggest`: Sugestões
- `classify`: Classificação
- `generate`: Geração de conteúdo

---

## 💰 Limites e Monetização

### Limites por Plano

| Plano | Execuções IA/Mês no App |
|---|---|
| FREE | 100 |
| PRO | 1.000 |
| TEAM | 10.000 |
| ENTERPRISE | Ilimitado |

### Como Funciona

1. **O DONO do app** consome os créditos de IA
2. Cada interação (mensagem do chat, análise, sugestão) = 1 execução
3. Limite é **mensal** (reseta todo dia 1º)
4. Quando o limite acaba, os usuários finais veem mensagem de erro

### Tracking de Uso

Os donos de apps podem ver:
- Total de execuções no mês
- Execuções por app
- Tokens consumidos
- Taxa de sucesso

---

## 📊 API Endpoint

### POST /api/ai/execute

Endpoint usado pelos componentes para executar IA.

**Request:**
```json
{
  "appId": "app_123",
  "aiAction": "chat",
  "prompt": "Qual o horário de funcionamento?",
  "persona": "Você é um assistente de clínica",
  "context": {
    "userAge": "30",
    "symptoms": "dor de cabeça"
  },
  "chatHistory": [
    {
      "role": "user",
      "content": "Olá"
    },
    {
      "role": "assistant",
      "content": "Olá! Como posso ajudar?"
    }
  ]
}
```

**Response (Success):**
```json
{
  "result": "Funcionamos de Segunda a Sexta, das 8h às 18h.",
  "tokensUsed": 45,
  "responseTime": 1250
}
```

**Response (Limite Atingido):**
```json
{
  "error": "O proprietário deste app atingiu o limite de requisições IA",
  "upgradeMessage": "Entre em contato com o desenvolvedor do app"
}
```

---

## 🎨 Exemplos Completos

### Exemplo 1: App de Clínica com Triagem

```json
{
  "type": "container",
  "components": [
    {
      "type": "text",
      "content": "Triagem Inteligente",
      "fontSize": 24,
      "fontWeight": "bold"
    },
    {
      "type": "input",
      "id": "sintomas",
      "label": "Descreva seus sintomas",
      "placeholder": "Ex: Dor de cabeça, febre...",
      "required": true
    },
    {
      "type": "input",
      "id": "idade",
      "label": "Idade",
      "inputType": "number",
      "required": true
    },
    {
      "type": "aiassistant",
      "id": "triagem",
      "prompt": "Paciente de {{idade}} anos com: {{sintomas}}. Sugira especialidade médica e explique.",
      "inputFields": ["sintomas", "idade"],
      "outputField": "especialidade",
      "buttonText": "Analisar Sintomas"
    },
    {
      "type": "input",
      "id": "especialidade",
      "label": "Especialidade Sugerida",
      "disabled": true
    }
  ]
}
```

### Exemplo 2: Chatbot de Atendimento

```json
{
  "type": "container",
  "components": [
    {
      "type": "aichat",
      "id": "suporte",
      "persona": "Você é o assistente de atendimento da empresa XYZ. Responda sobre:\n- Produtos: Notebooks, Smartphones, Tablets\n- Horário: 8h-18h de Segunda a Sexta\n- Formas de pagamento: Cartão, Boleto, Pix\n- Entrega: 5-10 dias úteis",
      "welcomeMessage": "Olá! Sou o assistente virtual da XYZ. Como posso ajudar?",
      "height": 500
    }
  ]
}
```

### Exemplo 3: Análise de Sentimento

```json
{
  "type": "container",
  "components": [
    {
      "type": "text",
      "content": "Deixe seu Feedback",
      "fontSize": 20,
      "fontWeight": "bold"
    },
    {
      "type": "input",
      "id": "feedback",
      "label": "Seu comentário",
      "placeholder": "Como foi sua experiência?",
      "inputType": "text"
    },
    {
      "type": "aianalyzer",
      "id": "analisar",
      "analyzeType": "sentiment",
      "sourceField": "feedback",
      "resultField": "sentimento",
      "autoAnalyze": true
    },
    {
      "type": "text",
      "id": "sentimento",
      "content": "{{sentimento}}",
      "fontSize": 16
    }
  ]
}
```

---

## 🔒 Segurança

### API Key Protegida
- ✅ API Key do Gemini **NUNCA** vai para o client-side
- ✅ Todas as requisições passam pelo servidor
- ✅ Validação de autenticação e autorização

### Rate Limiting
- ✅ Limites server-side (Prisma)
- ✅ Impossível burlar via client
- ✅ Tracking completo de uso

### Privacidade
- ✅ Dados contextuais não são armazenados permanentemente
- ✅ Logs limitados (500 chars prompt, 1000 chars resultado)
- ✅ Conformidade com LGPD

---

## 📈 Métricas e Analytics

### Banco de Dados - Modelo AppAIUsage

Cada execução de IA é registrada:

```typescript
{
  id: "cuid",
  userId: "user_123",      // Dono do app
  appId: "app_456",        // App onde foi executado
  aiAction: "chat",        // Tipo de ação
  prompt: "...",           // Prompt do usuário
  result: "...",           // Resposta da IA
  context: "{}",           // Contexto JSON
  tokensUsed: 45,          // Tokens consumidos
  responseTime: 1250,      // Tempo em ms
  wasSuccessful: true,     // Se teve sucesso
  errorMessage: null,      // Se houve erro
  createdAt: "2025-01-01"
}
```

### Queries Úteis

**Total de execuções por app:**
```prisma
appAIUsage.groupBy({
  by: ['appId'],
  _count: true
})
```

**Tokens consumidos no mês:**
```prisma
appAIUsage.aggregate({
  where: { createdAt: { gte: startOfMonth } },
  _sum: { tokensUsed: true }
})
```

---

## 🚀 Começando

### 1. Certifique-se de ter a API Key do Gemini

```env
GEMINI_API_KEY=your_api_key_here
```

### 2. Execute as migrations do Prisma

```bash
npx prisma migrate dev
```

### 3. Use os novos componentes no JSON

Adicione `aichat`, `aiassistant` ou `aianalyzer` no seu app!

### 4. Teste localmente

```bash
npm run dev
```

---

## 💡 Dicas e Boas Práticas

### Para Prompts Efetivos

✅ **Seja específico:** "Analise os sintomas e sugira especialidade médica"
❌ **Evite vago:** "Me ajude"

✅ **Dê contexto:** "Você é um assistente de clínica que..."
❌ **Sem contexto:** Apenas perguntas soltas

✅ **Use templates:** "Paciente de {{idade}} anos com {{sintomas}}"
❌ **Hardcode:** "Paciente com sintomas"

### Para UX

✅ **Welcome message clara:** "Olá! Sou o assistente da Clínica X"
❌ **Generic:** "Olá"

✅ **Loading states:** "Analisando seus sintomas..."
❌ **Sem feedback:** Botão travado sem explicação

✅ **Erro amigável:** "Limite atingido. Entre em contato com suporte"
❌ **Erro técnico:** "Error 429"

---

## 🎯 Roadmap Futuro

- [ ] Upload de imagens para análise
- [ ] Suporte a múltiplos idiomas
- [ ] Fine-tuning de modelos por app
- [ ] Integração com Whisper (voz)
- [ ] Analytics avançados de conversas
- [ ] A/B testing de prompts

---

## 📞 Suporte

Dúvidas? Problemas? Entre em contato:
- 📧 Email: support@uijson.com
- 💬 Discord: discord.gg/uijson
- 📚 Docs: docs.uijson.com

---

**Feito com ❤️ pela equipe UI-JSON**
