# Integração com APIs Externas

Esta feature permite que os aplicativos criados no UI-JSON façam requisições HTTP para APIs externas, possibilitando integração com serviços de terceiros.

## Funcionalidades

- ✅ Suporte a todos os métodos HTTP: GET, POST, PUT, DELETE
- ✅ Headers customizados (autenticação, tokens, etc.)
- ✅ Mapeamento de campos do formulário para o body da requisição
- ✅ Tratamento de sucesso e erro
- ✅ Limpeza automática de formulários após sucesso

## Como Usar

### Estrutura Básica

```json
{
  "type": "submit",
  "target": "api",
  "endpoint": "https://api.exemplo.com/endpoint",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer token123",
    "Content-Type": "application/json"
  },
  "fields": {
    "nome_campo_api": "id_do_input",
    "email": "email_input"
  },
  "onSuccess": {
    "type": "navigate",
    "target": "sucesso"
  },
  "onError": {
    "type": "popup",
    "variant": "alert",
    "message": "Erro ao processar requisição"
  }
}
```

### Propriedades

| Propriedade | Tipo | Obrigatório | Padrão | Descrição |
|------------|------|-------------|--------|-----------|
| `type` | string | ✅ | - | Sempre "submit" |
| `target` | string | ✅ | - | Deve ser "api" para chamadas externas |
| `endpoint` | string | ✅ | - | URL completa da API |
| `method` | string | ❌ | "POST" | GET, POST, PUT ou DELETE |
| `headers` | object | ❌ | {} | Headers HTTP customizados |
| `fields` | object | ❌ | {} | Mapeamento de campos (chave: campo API, valor: ID do input) |
| `onSuccess` | UIAction | ❌ | - | Ação executada em caso de sucesso |
| `onError` | UIAction | ❌ | - | Ação executada em caso de erro |

## Exemplos

### 1. POST - Criar Recurso

```json
{
  "type": "button",
  "id": "create_user",
  "text": "Criar Usuário",
  "action": {
    "type": "submit",
    "target": "api",
    "endpoint": "https://api.exemplo.com/users",
    "method": "POST",
    "fields": {
      "name": "name_input",
      "email": "email_input",
      "age": "age_input"
    },
    "onSuccess": {
      "type": "popup",
      "variant": "info",
      "title": "Sucesso!",
      "message": "Usuário criado com sucesso"
    },
    "onError": {
      "type": "popup",
      "variant": "alert",
      "title": "Erro",
      "message": "Falha ao criar usuário"
    }
  }
}
```

### 2. GET - Consultar Dados

```json
{
  "type": "button",
  "id": "search_weather",
  "text": "Consultar Clima",
  "action": {
    "type": "submit",
    "target": "api",
    "endpoint": "https://api.openweathermap.org/data/2.5/weather",
    "method": "GET",
    "fields": {
      "q": "city_input",
      "appid": "api_key_input",
      "units": "metric"
    },
    "onSuccess": {
      "type": "navigate",
      "target": "weather_result"
    }
  }
}
```

### 3. PUT - Atualizar Recurso

```json
{
  "type": "submit",
  "target": "api",
  "endpoint": "https://api.exemplo.com/users/123",
  "method": "PUT",
  "fields": {
    "name": "name_input",
    "email": "email_input"
  },
  "onSuccess": {
    "type": "popup",
    "message": "Dados atualizados!"
  }
}
```

### 4. DELETE - Remover Recurso

```json
{
  "type": "submit",
  "target": "api",
  "endpoint": "https://api.exemplo.com/posts/{{post_id}}",
  "method": "DELETE",
  "onSuccess": {
    "type": "navigate",
    "target": "home"
  }
}
```

### 5. Autenticação com Bearer Token

```json
{
  "type": "submit",
  "target": "api",
  "endpoint": "https://api.exemplo.com/protected",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "X-Custom-Header": "valor-customizado"
  },
  "fields": {
    "data": "data_input"
  }
}
```

### 6. Headers Dinâmicos com Variáveis

```json
{
  "type": "submit",
  "target": "api",
  "endpoint": "https://api.exemplo.com/data",
  "headers": {
    "Authorization": "Bearer {{token_input}}",
    "X-User-ID": "{{user_id}}"
  }
}
```

## Comportamento

### Sucesso (HTTP 2xx)

1. A resposta JSON é parseada
2. O console registra: `API Success: {data}`
3. Os campos do formulário são limpos
4. A ação `onSuccess` é executada (se definida)

### Erro (HTTP 4xx/5xx ou erro de rede)

1. O erro é capturado
2. O console registra: `API Error: {error}`
3. A ação `onError` é executada (se definida)
4. Os campos do formulário **não** são limpos

## Casos de Uso

### 1. App de Clima
Consulte a previsão do tempo de qualquer cidade usando OpenWeatherMap API.

### 2. Autenticação em Sistemas Externos
Faça login em APIs de terceiros e armazene tokens de autenticação.

### 3. CRUD Completo
Implemente Create, Read, Update, Delete usando diferentes endpoints e métodos.

### 4. Integração com Webhooks
Envie dados para webhooks (Zapier, Make, n8n) para automações.

### 5. Consulta de CEP
Use APIs como ViaCEP para buscar endereços automaticamente.

## Exemplos de APIs Públicas

```json
// ViaCEP - Consulta de CEP
{
  "endpoint": "https://viacep.com.br/ws/{{cep}}/json/",
  "method": "GET"
}

// JSONPlaceholder - API de testes
{
  "endpoint": "https://jsonplaceholder.typicode.com/posts",
  "method": "POST"
}

// CoinGecko - Preços de Criptomoedas
{
  "endpoint": "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl",
  "method": "GET"
}

// IBGE - Localidades
{
  "endpoint": "https://servicodados.ibge.gov.br/api/v1/localidades/estados",
  "method": "GET"
}
```

## CORS e Limitações

⚠️ **Atenção**: Algumas APIs públicas podem bloquear requisições diretas do navegador devido a políticas CORS (Cross-Origin Resource Sharing).

### Soluções:

1. **Use APIs com CORS habilitado** (a maioria das APIs modernas suporta)
2. **Proxy intermediário**: Configure um backend próprio que faça as requisições
3. **APIs específicas para frontend**: Prefira APIs que ofereçam endpoints com CORS habilitado

## Segurança

### ⚠️ NÃO faça:

- ❌ Nunca exponha API keys secretas no código JSON
- ❌ Não armazene senhas ou tokens sensíveis em texto plano
- ❌ Evite enviar dados sensíveis sem HTTPS

### ✅ Faça:

- ✅ Use HTTPS sempre que possível
- ✅ Implemente autenticação OAuth quando disponível
- ✅ Valide e sanitize inputs do usuário
- ✅ Use variáveis de ambiente para API keys (quando em produção)

## Debugging

Para debug, abra o console do navegador (F12) e verifique:

```javascript
// Sucesso
API Success: { id: 123, name: "João" }

// Erro
API Error: Error: HTTP 400: Bad Request
```

## Template de Exemplo

Veja o template **"App de Clima"** na galeria de templates para um exemplo completo e funcional de integração com API externa.

---

**Desenvolvido para UI-JSON Visualizer** | [Documentação Completa](../README.md)
