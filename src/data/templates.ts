/**
 * Template Gallery - Categorized app templates
 * Product Improvement: Quick Win #1
 */

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'ecommerce' | 'health' | 'education' | 'delivery' | 'fitness' | 'productivity' | 'social' | 'finance';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  features: string[];
  preview: string;
  json: string;
  author?: string;
  rating?: number;
  downloads?: number;
}

export const templateCategories = {
  ecommerce: { name: 'E-commerce', icon: '🛍️', color: '#8B5CF6' },
  health: { name: 'Saúde', icon: '🏥', color: '#10B981' },
  education: { name: 'Educação', icon: '📚', color: '#3B82F6' },
  delivery: { name: 'Delivery', icon: '🚚', color: '#F59E0B' },
  fitness: { name: 'Fitness', icon: '💪', color: '#EF4444' },
  productivity: { name: 'Produtividade', icon: '✅', color: '#6366F1' },
  social: { name: 'Social', icon: '👥', color: '#EC4899' },
  finance: { name: 'Finanças', icon: '💰', color: '#14B8A6' },
};

export const templates: Template[] = [
  // E-COMMERCE
  {
    id: 'ecommerce-store',
    name: 'Loja Online',
    description: 'App de e-commerce completo com catálogo de produtos, carrinho e checkout',
    category: 'ecommerce',
    difficulty: 'intermediate',
    features: ['Catálogo de produtos', 'Carrinho de compras', 'Checkout', 'Autenticação'],
    preview: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=400',
    author: 'UI-JSON Team',
    rating: 4.8,
    downloads: 1253,
    json: `{
  "version": "1.0",
  "app": {
    "name": "Loja Online",
    "theme": {
      "primaryColor": "#8B5CF6",
      "backgroundColor": "#F9FAFB",
      "textColor": "#111827"
    },
    "databaseSchema": {
      "products": {
        "fields": {
          "id": { "type": "string", "primaryKey": true },
          "name": { "type": "string" },
          "price": { "type": "number" },
          "image": { "type": "string" },
          "description": { "type": "string" },
          "category": { "type": "string" }
        }
      },
      "cart": {
        "fields": {
          "id": { "type": "string", "primaryKey": true },
          "productId": { "type": "string" },
          "quantity": { "type": "number" }
        }
      }
    }
  },
  "screens": {
    "catalog": {
      "id": "catalog",
      "title": "Catálogo",
      "padding": 16,
      "components": [
        {
          "type": "text",
          "id": "store_title",
          "content": "🛍️ Nossa Loja",
          "fontSize": 32,
          "fontWeight": "bold",
          "marginBottom": 24
        },
        {
          "type": "list",
          "id": "products_list",
          "dataSource": { "table": "products" },
          "items": [
            {
              "id": "{{id}}",
              "title": "{{name}}",
              "subtitle": "R$ {{price}}",
              "image": "{{image}}"
            }
          ],
          "emptyMessage": "Nenhum produto disponível"
        }
      ]
    }
  },
  "initialScreen": "catalog"
}`
  },

  // HEALTH
  {
    id: 'health-tracker',
    name: 'Rastreador de Saúde',
    description: 'Monitore sua saúde com tracking de água, exercícios e peso',
    category: 'health',
    difficulty: 'beginner',
    features: ['Water tracking', 'Registro de exercícios', 'Controle de peso'],
    preview: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400',
    author: 'UI-JSON Team',
    rating: 4.6,
    downloads: 892,
    json: `{
  "version": "1.0",
  "app": {
    "name": "Rastreador de Saúde",
    "theme": {
      "primaryColor": "#10B981",
      "backgroundColor": "#F0FDF4",
      "textColor": "#111827"
    },
    "databaseSchema": {
      "water_intake": {
        "fields": {
          "id": { "type": "string", "primaryKey": true },
          "date": { "type": "date" },
          "glasses": { "type": "number", "default": 0 }
        }
      },
      "exercises": {
        "fields": {
          "id": { "type": "string", "primaryKey": true },
          "name": { "type": "string" },
          "duration": { "type": "number" },
          "date": { "type": "date" }
        }
      }
    }
  },
  "screens": {
    "home": {
      "id": "home",
      "title": "Saúde",
      "padding": 16,
      "components": [
        {
          "type": "text",
          "id": "health_title",
          "content": "💪 Minha Saúde",
          "fontSize": 32,
          "fontWeight": "bold",
          "textAlign": "center",
          "marginBottom": 24
        },
        {
          "type": "card",
          "id": "water_card",
          "padding": 20,
          "marginBottom": 16,
          "components": [
            {
              "type": "text",
              "id": "water_label",
              "content": "💧 Água Hoje",
              "fontSize": 20,
              "fontWeight": "bold",
              "marginBottom": 12
            },
            {
              "type": "button",
              "id": "add_water",
              "text": "+ 1 Copo",
              "variant": "primary",
              "action": {
                "type": "submit",
                "target": "database",
                "table": "water_intake",
                "fields": {
                  "glasses": "water_count"
                }
              }
            }
          ]
        },
        {
          "type": "button",
          "id": "view_exercises",
          "text": "Ver Exercícios",
          "variant": "secondary",
          "fullWidth": true,
          "action": {
            "type": "navigate",
            "target": "exercises"
          }
        }
      ]
    },
    "exercises": {
      "id": "exercises",
      "title": "Exercícios",
      "padding": 16,
      "components": [
        {
          "type": "text",
          "id": "exercises_title",
          "content": "🏃 Exercícios",
          "fontSize": 28,
          "fontWeight": "bold",
          "marginBottom": 20
        },
        {
          "type": "list",
          "id": "exercises_list",
          "dataSource": { "table": "exercises" },
          "items": [
            {
              "id": "{{id}}",
              "title": "{{name}}",
              "subtitle": "{{duration}} minutos - {{date}}"
            }
          ],
          "emptyMessage": "Nenhum exercício registrado"
        }
      ]
    }
  },
  "initialScreen": "home"
}`
  },

  // EDUCATION
  {
    id: 'education-courses',
    name: 'Plataforma de Cursos',
    description: 'App de educação com cursos, lições e progresso do aluno',
    category: 'education',
    difficulty: 'advanced',
    features: ['Catálogo de cursos', 'Tracking de progresso', 'Certificados', 'Quiz'],
    preview: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400',
    author: 'UI-JSON Team',
    rating: 4.9,
    downloads: 2145,
    json: `{
  "version": "1.0",
  "app": {
    "name": "Cursos Online",
    "theme": {
      "primaryColor": "#3B82F6",
      "backgroundColor": "#F9FAFB",
      "textColor": "#111827"
    },
    "databaseSchema": {
      "courses": {
        "fields": {
          "id": { "type": "string", "primaryKey": true },
          "title": { "type": "string" },
          "description": { "type": "string" },
          "instructor": { "type": "string" },
          "duration": { "type": "string" },
          "lessons": { "type": "number" }
        }
      },
      "enrollments": {
        "fields": {
          "id": { "type": "string", "primaryKey": true },
          "courseId": { "type": "string" },
          "progress": { "type": "number", "default": 0 },
          "completed": { "type": "boolean", "default": false }
        }
      }
    }
  },
  "screens": {
    "courses": {
      "id": "courses",
      "title": "Cursos",
      "padding": 16,
      "components": [
        {
          "type": "text",
          "id": "courses_title",
          "content": "📚 Meus Cursos",
          "fontSize": 32,
          "fontWeight": "bold",
          "marginBottom": 24
        },
        {
          "type": "list",
          "id": "courses_list",
          "dataSource": { "table": "courses" },
          "items": [
            {
              "id": "{{id}}",
              "title": "{{title}}",
              "subtitle": "{{instructor}} • {{lessons}} lições"
            }
          ],
          "emptyMessage": "Nenhum curso disponível"
        }
      ]
    }
  },
  "initialScreen": "courses"
}`
  },

  // DELIVERY
  {
    id: 'food-delivery',
    name: 'App de Delivery',
    description: 'Delivery de comida com menu, carrinho e rastreamento de pedidos',
    category: 'delivery',
    difficulty: 'intermediate',
    features: ['Menu digital', 'Carrinho', 'Rastreamento', 'Avaliações'],
    preview: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
    author: 'UI-JSON Team',
    rating: 4.7,
    downloads: 1678,
    json: `{
  "version": "1.0",
  "app": {
    "name": "Food Delivery",
    "theme": {
      "primaryColor": "#F59E0B",
      "backgroundColor": "#FFFBEB",
      "textColor": "#111827"
    },
    "databaseSchema": {
      "menu_items": {
        "fields": {
          "id": { "type": "string", "primaryKey": true },
          "name": { "type": "string" },
          "description": { "type": "string" },
          "price": { "type": "number" },
          "category": { "type": "string" },
          "image": { "type": "string" }
        }
      },
      "orders": {
        "fields": {
          "id": { "type": "string", "primaryKey": true },
          "items": { "type": "string" },
          "total": { "type": "number" },
          "status": { "type": "string", "default": "pending" },
          "address": { "type": "string" }
        }
      }
    }
  },
  "screens": {
    "menu": {
      "id": "menu",
      "title": "Menu",
      "padding": 16,
      "components": [
        {
          "type": "text",
          "id": "menu_title",
          "content": "🍕 Cardápio",
          "fontSize": 32,
          "fontWeight": "bold",
          "marginBottom": 24
        },
        {
          "type": "list",
          "id": "menu_list",
          "dataSource": { "table": "menu_items" },
          "items": [
            {
              "id": "{{id}}",
              "title": "{{name}}",
              "subtitle": "R$ {{price}}",
              "image": "{{image}}"
            }
          ],
          "emptyMessage": "Menu vazio"
        }
      ]
    }
  },
  "initialScreen": "menu"
}`
  },

  // FITNESS
  {
    id: 'workout-planner',
    name: 'Planejador de Treinos',
    description: 'Crie e acompanhe seus treinos de fitness',
    category: 'fitness',
    difficulty: 'beginner',
    features: ['Biblioteca de exercícios', 'Planos de treino', 'Timer', 'Histórico'],
    preview: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
    author: 'UI-JSON Team',
    rating: 4.5,
    downloads: 745,
    json: `{
  "version": "1.0",
  "app": {
    "name": "Workout Planner",
    "theme": {
      "primaryColor": "#EF4444",
      "backgroundColor": "#FEF2F2",
      "textColor": "#111827"
    },
    "databaseSchema": {
      "workouts": {
        "fields": {
          "id": { "type": "string", "primaryKey": true },
          "name": { "type": "string" },
          "exercises": { "type": "string" },
          "duration": { "type": "number" },
          "completed": { "type": "boolean", "default": false }
        }
      }
    }
  },
  "screens": {
    "workouts": {
      "id": "workouts",
      "title": "Treinos",
      "padding": 16,
      "components": [
        {
          "type": "text",
          "id": "workout_title",
          "content": "💪 Meus Treinos",
          "fontSize": 32,
          "fontWeight": "bold",
          "marginBottom": 24
        },
        {
          "type": "list",
          "id": "workouts_list",
          "dataSource": { "table": "workouts" },
          "items": [
            {
              "id": "{{id}}",
              "title": "{{name}}",
              "subtitle": "{{duration}} min"
            }
          ],
          "emptyMessage": "Crie seu primeiro treino!"
        }
      ]
    }
  },
  "initialScreen": "workouts"
}`
  },

  // FINANCE
  {
    id: 'expense-tracker',
    name: 'Controle de Gastos',
    description: 'Gerencie suas finanças pessoais com categorias e relatórios',
    category: 'finance',
    difficulty: 'intermediate',
    features: ['Registro de despesas', 'Categorias', 'Gráficos', 'Metas'],
    preview: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
    author: 'UI-JSON Team',
    rating: 4.8,
    downloads: 1456,
    json: `{
  "version": "1.0",
  "app": {
    "name": "Controle Financeiro",
    "theme": {
      "primaryColor": "#14B8A6",
      "backgroundColor": "#F0FDFA",
      "textColor": "#111827"
    },
    "databaseSchema": {
      "expenses": {
        "fields": {
          "id": { "type": "string", "primaryKey": true },
          "description": { "type": "string" },
          "amount": { "type": "number" },
          "category": { "type": "string" },
          "date": { "type": "date" }
        }
      },
      "budgets": {
        "fields": {
          "id": { "type": "string", "primaryKey": true },
          "category": { "type": "string" },
          "limit": { "type": "number" },
          "current": { "type": "number", "default": 0 }
        }
      }
    }
  },
  "screens": {
    "dashboard": {
      "id": "dashboard",
      "title": "Dashboard",
      "padding": 16,
      "components": [
        {
          "type": "text",
          "id": "finance_title",
          "content": "💰 Finanças",
          "fontSize": 32,
          "fontWeight": "bold",
          "marginBottom": 24
        },
        {
          "type": "card",
          "id": "summary_card",
          "padding": 20,
          "marginBottom": 20,
          "components": [
            {
              "type": "text",
              "id": "total_label",
              "content": "Gastos do Mês",
              "fontSize": 16,
              "color": "#6B7280"
            },
            {
              "type": "text",
              "id": "total_amount",
              "content": "R$ 0,00",
              "fontSize": 32,
              "fontWeight": "bold",
              "color": "#14B8A6"
            }
          ]
        },
        {
          "type": "list",
          "id": "expenses_list",
          "dataSource": { "table": "expenses" },
          "items": [
            {
              "id": "{{id}}",
              "title": "{{description}}",
              "subtitle": "R$ {{amount}} - {{category}}"
            }
          ],
          "emptyMessage": "Nenhuma despesa registrada"
        }
      ]
    }
  },
  "initialScreen": "dashboard"
}`
  }
];

export const getTemplatesByCategory = (category: string) => {
  return templates.filter(t => t.category === category);
};

export const getTemplateById = (id: string) => {
  return templates.find(t => t.id === id);
};

export const getFeaturedTemplates = () => {
  return templates.filter(t => (t.rating || 0) >= 4.7);
};
