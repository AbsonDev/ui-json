export const loginAppJson = `{
  "version": "1.0",
  "app": {
    "name": "Meu App com Auth",
    "theme": {
      "primaryColor": "#007AFF",
      "backgroundColor": "#F5F5F5",
      "textColor": "#1F2937"
    },
    "databaseSchema": {
      "users": {
        "fields": {
          "id": { "type": "string", "primaryKey": true },
          "email": { "type": "string" },
          "password": { "type": "string" }
        }
      }
    },
    "authentication": {
      "enabled": true,
      "userTable": "users",
      "emailField": "email",
      "passwordField": "password",
      "postLoginScreen": "dashboard",
      "authRedirectScreen": "auth:login"
    }
  },
  "screens": {
    "welcome": {
      "id": "welcome",
      "title": "Bem-vindo",
      "layout": "vertical",
      "padding": 24,
      "components": [
        {
          "type": "text",
          "id": "welcome_title",
          "content": "Bem-vindo ao App!",
          "fontSize": 28,
          "fontWeight": "bold",
          "textAlign": "center",
          "marginBottom": 32
        },
        {
          "type": "text",
          "id": "welcome_subtitle",
          "content": "Faça login ou crie uma conta para continuar.",
          "fontSize": 16,
          "textAlign": "center",
          "marginBottom": 32
        },
        {
            "type": "button",
            "id": "go_to_login",
            "text": "Login",
            "variant": "primary",
            "fullWidth": true,
            "marginBottom": 16,
            "showIf": "session.isLoggedOut",
            "action": {
                "type": "navigate",
                "target": "auth:login"
            }
        },
        {
            "type": "button",
            "id": "go_to_signup",
            "text": "Criar Conta",
            "variant": "secondary",
            "fullWidth": true,
            "showIf": "session.isLoggedOut",
            "action": {
                "type": "navigate",
                "target": "auth:signup"
            }
        },
         {
            "type": "button",
            "id": "go_to_dashboard",
            "text": "Ir para o Dashboard",
            "variant": "primary",
            "fullWidth": true,
            "showIf": "session.isLoggedIn",
            "action": {
                "type": "navigate",
                "target": "dashboard"
            }
        }
      ]
    },
    "dashboard": {
        "id": "dashboard",
        "title": "Dashboard",
        "requiresAuth": true,
        "padding": 16,
        "components": [
            {
                "type": "text",
                "id": "dash_title",
                "content": "Dashboard",
                "fontSize": 32,
                "fontWeight": "bold",
                "marginBottom": 24
            },
            {
                "type": "text",
                "id": "dash_welcome",
                "content": "Você está logado como: {{session.user.email}}",
                "fontSize": 18,
                "marginBottom": 32
            },
            {
                "type": "button",
                "id": "logout_btn",
                "text": "Log Out",
                "variant": "secondary",
                "action": {
                    "type": "auth:logout",
                    "onSuccess": {
                      "type": "navigate",
                      "target": "welcome"
                    }
                }
            }
        ]
    }
  },
  "initialScreen": "welcome"
}
`;

export const todoAppJson = `{
  "version": "1.0",
  "app": {
    "name": "To-Do List",
    "theme": {
      "primaryColor": "$primary",
      "backgroundColor": "$background",
      "textColor": "$text"
    },
    "designTokens": {
      "primary": "#10B981",
      "background": "#F9FAFB",
      "text": "#111827",
      "spacingLarge": 24,
      "spacingMedium": 16,
      "spacingSmall": 8,
      "fontSizeHeader": 32
    },
    "databaseSchema": {
      "tasks": {
        "fields": {
          "id": { "type": "string", "primaryKey": true },
          "title": { "type": "string", "description": "O conteúdo da tarefa a fazer." },
          "completed": { "type": "boolean", "default": false, "description": "Indica se a tarefa foi concluída." }
        }
      }
    }
  },
  "screens": {
    "main": {
      "id": "main",
      "title": "My To-Do List",
      "padding": "$spacingMedium",
      "components": [
        {
          "type": "text",
          "id": "header_title",
          "content": "My Tasks",
          "fontSize": "$fontSizeHeader",
          "fontWeight": "bold",
          "marginBottom": "$spacingLarge"
        },
        {
          "type": "container",
          "id": "add_task_container",
          "layout": "horizontal",
          "alignment": "start",
          "marginBottom": "$spacingLarge",
          "components": [
            {
              "type": "input",
              "id": "new_task_input",
              "placeholder": "Add a new task..."
            },
            {
              "type": "button",
              "id": "add_task_btn",
              "text": "Add",
              "variant": "primary",
              "marginLeft": "$spacingSmall",
              "action": {
                "type": "submit",
                "target": "database",
                "table": "tasks",
                "fields": {
                  "title": "new_task_input"
                }
              }
            }
          ]
        },
        {
          "type": "list",
          "id": "task_list",
          "dataSource": { "table": "tasks" },
          "items": [
            {
              "id": "{{id}}",
              "title": "{{title}}"
            }
          ],
          "emptyMessage": "No tasks yet. Add one above!"
        }
      ]
    }
  },
  "initialScreen": "main"
}
`;

export const appointmentAppJson = `{
  "version": "1.0",
  "app": {
    "name": "Agendamentos",
    "theme": {
      "primaryColor": "#8B5CF6",
      "backgroundColor": "#F9FAFB",
      "textColor": "#111827"
    },
    "databaseSchema": {
      "appointments": {
        "fields": {
          "id": { "type": "string", "primaryKey": true },
          "description": { "type": "string" },
          "date": { "type": "date" },
          "time": { "type": "time" },
          "completed": { "type": "boolean", "default": false }
        }
      }
    }
  },
  "screens": {
    "main": {
      "id": "main",
      "title": "Meus Agendamentos",
      "padding": 16,
      "components": [
        {
          "type": "text",
          "id": "header_title",
          "content": "Agendamentos",
          "fontSize": 32,
          "fontWeight": "bold",
          "marginBottom": 24
        },
        {
          "type": "button",
          "id": "add_appointment_nav_btn",
          "text": "Novo Agendamento",
          "variant": "primary",
          "fullWidth": true,
          "marginBottom": 24,
          "action": {
            "type": "navigate",
            "target": "addAppointment"
          }
        },
        {
          "type": "list",
          "id": "appointment_list",
          "dataSource": { "table": "appointments" },
          "items": [
            {
              "id": "{{id}}",
              "title": "{{description}}",
              "subtitle": "Data: {{date}} - Hora: {{time}}"
            }
          ],
          "emptyMessage": "Nenhum agendamento encontrado."
        }
      ]
    },
    "addAppointment": {
      "id": "addAppointment",
      "title": "Novo Agendamento",
      "padding": 16,
      "components": [
        {
          "type": "text",
          "id": "add_header_title",
          "content": "Novo Agendamento",
          "fontSize": 28,
          "fontWeight": "bold",
          "marginBottom": 24
        },
        {
          "type": "input",
          "id": "desc_input",
          "label": "Descrição",
          "placeholder": "Ex: Reunião com equipe",
          "marginBottom": 16
        },
        {
          "type": "datepicker",
          "id": "date_input",
          "label": "Data",
          "marginBottom": 16
        },
        {
          "type": "timepicker",
          "id": "time_input",
          "label": "Hora",
          "marginBottom": 24
        },
        {
          "type": "button",
          "id": "save_btn",
          "text": "Salvar",
          "variant": "primary",
          "fullWidth": true,
          "action": {
            "type": "submit",
            "target": "database",
            "table": "appointments",
            "fields": {
              "description": "desc_input",
              "date": "date_input",
              "time": "time_input"
            },
            "onSuccess": {
              "type": "navigate",
              "target": "main"
            }
          }
        },
        {
          "type": "button",
          "id": "cancel_btn",
          "text": "Cancelar",
          "variant": "text",
          "fullWidth": true,
          "marginTop": 8,
          "action": {
            "type": "navigate",
            "target": "main"
          }
        }
      ]
    }
  },
  "initialScreen": "main"
}
`;


export const blankAppJson = `{
  "version": "1.0",
  "app": {
    "name": "Novo Aplicativo",
    "theme": {
      "primaryColor": "#007AFF",
      "backgroundColor": "#FFFFFF",
      "textColor": "#111827"
    }
  },
  "screens": {
    "home": {
      "id": "home",
      "title": "Home",
      "layout": "vertical",
      "padding": 20,
      "components": [
        {
          "type": "text",
          "id": "welcome_text",
          "content": "Bem-vindo ao seu novo aplicativo!",
          "fontSize": 24,
          "fontWeight": "bold",
          "textAlign": "center"
        }
      ]
    }
  },
  "initialScreen": "home"
}
`;

export const sampleApps = [
    { name: 'Login App', json: loginAppJson },
    { name: 'To-Do List', json: todoAppJson },
    { name: 'Appointment Scheduler', json: appointmentAppJson },
];

interface Snippet {
  name: string;
  description: string;
  json: string;
}

export const snippets: Snippet[] = [
  {
    name: 'Formulário de Login',
    description: 'Campos de e-mail, senha e um botão de login. Requer configuração de autenticação.',
    json: `
[
  {
    "type": "input",
    "id": "email_input",
    "label": "Email",
    "inputType": "email",
    "placeholder": "seu@email.com",
    "marginBottom": 16
  },
  {
    "type": "input",
    "id": "password_input",
    "label": "Senha",
    "inputType": "password",
    "placeholder": "••••••••",
    "marginBottom": 24
  },
  {
    "type": "button",
    "id": "login_button",
    "text": "Entrar",
    "variant": "primary",
    "fullWidth": true,
    "action": {
      "type": "auth:login",
      "fields": {
        "email": "email_input",
        "password": "password_input"
      },
      "onError": {
        "type": "popup",
        "title": "Erro",
        "message": "Credenciais inválidas."
      }
    }
  }
]
    `
  },
  {
    name: 'Card de Perfil de Usuário',
    description: 'Um card com uma imagem, nome e e-mail. Ideal para dashboards.',
    json: `
{
  "type": "card",
  "id": "user_profile_card",
  "padding": 16,
  "borderRadius": 8,
  "components": [
    {
      "type": "container",
      "id": "profile_container",
      "layout": "horizontal",
      "alignment": "center",
      "components": [
        {
          "type": "image",
          "id": "profile_image",
          "source": "https://i.pravatar.cc/150?u=a042581f4e29026704d",
          "width": 64,
          "height": 64,
          "borderRadius": 32,
          "marginRight": 16
        },
        {
          "type": "container",
          "id": "profile_info_container",
          "layout": "vertical",
          "components": [
            {
              "type": "text",
              "id": "profile_name",
              "content": "Nome do Usuário",
              "fontSize": 18,
              "fontWeight": "bold"
            },
            {
              "type": "text",
              "id": "profile_email",
              "content": "usuario@exemplo.com",
              "color": "#6B7280"
            }
          ]
        }
      ]
    }
  ]
}
    `
  },
  {
    name: 'Card de Produto',
    description: 'Exibe uma imagem, título, preço e um botão de compra para um item.',
    json: `
{
  "type": "card",
  "id": "product_card",
  "padding": 0,
  "borderRadius": 12,
  "elevation": 4,
  "components": [
    {
      "type": "image",
      "id": "product_image",
      "source": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
      "height": 180,
      "resizeMode": "cover"
    },
    {
      "type": "container",
      "id": "product_info_container",
      "padding": 16,
      "components": [
        {
          "type": "text",
          "id": "product_title",
          "content": "Tênis Esportivo",
          "fontSize": 20,
          "fontWeight": "bold",
          "marginBottom": 8
        },
        {
          "type": "text",
          "id": "product_price",
          "content": "R$ 299,90",
          "fontSize": 18,
          "color": "#10B981",
          "marginBottom": 16
        },
        {
          "type": "button",
          "id": "add_to_cart_button",
          "text": "Adicionar ao Carrinho",
          "variant": "primary",
          "fullWidth": true,
          "action": {
            "type": "popup",
            "message": "Produto adicionado!"
          }
        }
      ]
    }
  ]
}
    `
  }
];