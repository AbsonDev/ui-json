/**
 * Gera sugestões inteligentes de prompts baseado no estado atual do JSON
 */

interface UIJson {
  version?: string;
  app?: {
    name?: string;
    authentication?: any;
    databaseSchema?: Record<string, any>;
  };
  screens?: Record<string, any>;
  initialScreen?: string;
}

export function getPromptSuggestions(jsonString: string): string[] {
  const suggestions: string[] = [];

  try {
    // Se JSON está vazio ou inválido
    if (!jsonString || jsonString.trim().length < 10) {
      return [
        "Crie uma tela de login",
        "Crie um app de lista de tarefas",
        "Crie um app de catálogo de produtos",
        "Crie uma tela de dashboard",
        "Crie um formulário de cadastro",
      ];
    }

    const json: UIJson = JSON.parse(jsonString);

    // Se não tem autenticação
    if (!json.app?.authentication || !json.app.authentication.enabled) {
      suggestions.push("Adicione autenticação ao app");
      suggestions.push("Crie telas de login e cadastro");
    }

    // Se tem autenticação mas sem telas protegidas
    if (json.app?.authentication?.enabled && json.screens) {
      const hasProtectedScreens = Object.values(json.screens).some(
        (screen: any) => screen.requiresAuth === true
      );
      if (!hasProtectedScreens) {
        suggestions.push("Proteja telas privadas com autenticação");
      }
    }

    // Se não tem banco de dados
    if (!json.app?.databaseSchema || Object.keys(json.app.databaseSchema).length === 0) {
      suggestions.push("Configure o banco de dados");
      suggestions.push("Crie uma tabela para armazenar dados");
    }

    // Se tem banco mas sem telas que usam
    if (json.app?.databaseSchema && Object.keys(json.app.databaseSchema).length > 0) {
      const hasDatabaseScreens = json.screens && Object.values(json.screens).some(
        (screen: any) => {
          const hasDataSource = screen.components?.some(
            (comp: any) => comp.dataSource?.table
          );
          return hasDataSource;
        }
      );

      if (!hasDatabaseScreens) {
        suggestions.push("Crie uma tela para exibir dados do banco");
        suggestions.push("Adicione uma lista conectada ao banco");
      }
    }

    // Se tem poucas telas
    const screenCount = json.screens ? Object.keys(json.screens).length : 0;
    if (screenCount === 0) {
      suggestions.push("Crie a primeira tela do app");
    } else if (screenCount === 1) {
      suggestions.push("Adicione mais uma tela");
      suggestions.push("Crie uma tela de configurações");
    }

    // Sugestões específicas por tipo de app
    const appName = json.app?.name?.toLowerCase() || '';

    if (appName.includes('todo') || appName.includes('tarefa')) {
      suggestions.push("Adicione filtro de tarefas concluídas");
      suggestions.push("Adicione botão para marcar tarefa como completa");
    } else if (appName.includes('produto') || appName.includes('loja')) {
      suggestions.push("Adicione carrinho de compras");
      suggestions.push("Crie tela de detalhes do produto");
    } else if (appName.includes('blog') || appName.includes('post')) {
      suggestions.push("Adicione tela de criar post");
      suggestions.push("Adicione lista de comentários");
    }

    // Sugestões de melhorias gerais
    if (screenCount > 0) {
      suggestions.push("Melhore o design com cores personalizadas");
      suggestions.push("Adicione ícones aos botões");
      suggestions.push("Adicione navegação entre telas");
    }

    // Limitar a 5 sugestões mais relevantes
    return suggestions.slice(0, 5);
  } catch (error) {
    // Se JSON inválido, retornar sugestões básicas
    return [
      "Crie uma tela de login",
      "Crie um app de lista de tarefas",
      "Crie uma tela de dashboard",
    ];
  }
}

/**
 * Categoriza o tipo de app baseado no JSON
 */
export function categorizeApp(jsonString: string): string | null {
  try {
    const json: UIJson = JSON.parse(jsonString);
    const appName = json.app?.name?.toLowerCase() || '';
    const hasDatabase = json.app?.databaseSchema && Object.keys(json.app.databaseSchema).length > 0;
    const hasAuth = json.app?.authentication?.enabled;

    if (appName.includes('todo') || appName.includes('tarefa')) {
      return 'App de Tarefas';
    }
    if (appName.includes('produto') || appName.includes('loja') || appName.includes('ecommerce')) {
      return 'E-commerce';
    }
    if (appName.includes('blog') || appName.includes('post')) {
      return 'Blog/Rede Social';
    }
    if (hasAuth && hasDatabase) {
      return 'App Completo';
    }
    if (hasDatabase) {
      return 'App com Dados';
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Gera dicas contextuais baseadas no app
 */
export function getContextualTips(jsonString: string): string[] {
  const tips: string[] = [];

  try {
    const json: UIJson = JSON.parse(jsonString);

    // Dica sobre design tokens
    if (!json.app?.designTokens || Object.keys(json.app.designTokens || {}).length === 0) {
      tips.push("💡 Use design tokens para manter cores e espaçamentos consistentes");
    }

    // Dica sobre autenticação
    if (json.app?.authentication?.enabled) {
      const hasLogoutButton = json.screens && Object.values(json.screens).some(
        (screen: any) => screen.components?.some(
          (comp: any) => comp.action?.type === 'auth:logout'
        )
      );

      if (!hasLogoutButton) {
        tips.push("⚠️ Não esqueça de adicionar um botão de logout");
      }
    }

    // Dica sobre validação
    const hasFormInputs = json.screens && Object.values(json.screens).some(
      (screen: any) => screen.components?.some(
        (comp: any) => comp.type === 'input'
      )
    );

    if (hasFormInputs) {
      tips.push("💡 Adicione validações nos campos de formulário");
    }

    return tips;
  } catch {
    return [];
  }
}
