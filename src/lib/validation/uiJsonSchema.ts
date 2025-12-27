import { z } from 'zod';

/**
 * Schema de validação completo para UI-JSON
 * Garante que o JSON gerado pela IA esteja estruturalmente correto
 */

// Componentes válidos
const componentTypes = [
  'text',
  'input',
  'button',
  'image',
  'list',
  'card',
  'select',
  'checkbox',
  'container',
  'divider',
  'datepicker',
  'timepicker',
] as const;

// Schema para Design Tokens
const designTokensSchema = z.record(
  z.union([z.string(), z.number()])
).optional();

// Schema para campos do banco de dados
const databaseFieldSchema = z.object({
  type: z.enum(['string', 'number', 'boolean', 'date', 'time']),
  description: z.string().optional(),
  default: z.any().optional(),
  required: z.boolean().optional(),
});

// Schema para tabelas do banco
const databaseSchemaSchema = z.record(
  z.object({
    fields: z.record(databaseFieldSchema),
    description: z.string().optional(),
  })
).optional();

// Schema para autenticação
const authenticationSchema = z.object({
  enabled: z.boolean(),
  userTable: z.string(),
  emailField: z.string(),
  passwordField: z.string(),
  postLoginScreen: z.string(),
  authRedirectScreen: z.string(),
}).optional();

// Schema para ações de componentes
const actionSchema = z.object({
  type: z.enum(['navigate', 'submit', 'auth:login', 'auth:signup', 'auth:logout']),
  target: z.string().optional(),
  screen: z.string().optional(),
  table: z.string().optional(),
  fields: z.record(z.string()).optional(),
}).optional();

// Schema para data source
const dataSourceSchema = z.object({
  table: z.string(),
  filters: z.record(z.any()).optional(),
  orderBy: z.string().optional(),
}).optional();

// Schema recursivo para componentes (sem validação profunda para permitir flexibilidade)
const componentSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.enum(componentTypes),
    id: z.string().optional(),
    content: z.string().optional(),
    placeholder: z.string().optional(),
    action: actionSchema,
    dataSource: dataSourceSchema,
    template: z.any().optional(),
    showIf: z.enum(['session.isLoggedIn', 'session.isLoggedOut']).optional(),
    style: z.record(z.any()).optional(),
    children: z.array(componentSchema).optional(),
  }).passthrough() // Permite campos extras para flexibilidade
);

// Schema para telas
const screenSchema = z.object({
  title: z.string().optional(),
  requiresAuth: z.boolean().optional(),
  components: z.array(componentSchema).optional(),
  layout: z.any().optional(),
}).passthrough();

// Schema para tema
const themeSchema = z.object({
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  fontFamily: z.string().optional(),
}).passthrough().optional();

// Schema principal do UI-JSON
export const uiJsonSchema = z.object({
  version: z.string(),
  app: z.object({
    name: z.string(),
    theme: themeSchema,
    designTokens: designTokensSchema,
    databaseSchema: databaseSchemaSchema,
    authentication: authenticationSchema,
  }).passthrough(),
  screens: z.record(screenSchema),
  initialScreen: z.string(),
}).passthrough();

// Type exports
export type UIJson = z.infer<typeof uiJsonSchema>;
export type ComponentType = typeof componentTypes[number];
export type DatabaseSchema = z.infer<typeof databaseSchemaSchema>;
export type ScreenSchema = z.infer<typeof screenSchema>;

/**
 * Valida UI-JSON e retorna resultado estruturado
 */
export function validateUIJson(json: unknown): {
  success: boolean;
  data?: UIJson;
  errors?: string[];
} {
  try {
    const validated = uiJsonSchema.parse(json);
    return {
      success: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return {
      success: false,
      errors: ['Erro desconhecido na validação'],
    };
  }
}

/**
 * Valida se uma tela referenciada existe
 */
export function validateScreenReference(
  json: UIJson,
  screenId: string
): boolean {
  return screenId in json.screens || screenId.startsWith('auth:');
}

/**
 * Valida se uma tabela referenciada existe no schema
 */
export function validateTableReference(
  json: UIJson,
  tableName: string
): boolean {
  return json.app.databaseSchema
    ? tableName in json.app.databaseSchema
    : false;
}

/**
 * Extrai e valida todas as referências (telas, tabelas) no JSON
 */
export function validateReferences(json: UIJson): {
  missingScreens: string[];
  missingTables: string[];
} {
  const missingScreens: Set<string> = new Set();
  const missingTables: Set<string> = new Set();

  // Validar initialScreen
  if (!validateScreenReference(json, json.initialScreen)) {
    missingScreens.add(json.initialScreen);
  }

  // Validar referências em ações
  Object.values(json.screens).forEach((screen) => {
    if (!screen.components) return;

    const checkComponent = (comp: any) => {
      if (comp.action) {
        if (comp.action.screen && !validateScreenReference(json, comp.action.screen)) {
          missingScreens.add(comp.action.screen);
        }
        if (comp.action.table && !validateTableReference(json, comp.action.table)) {
          missingTables.add(comp.action.table);
        }
      }
      if (comp.dataSource?.table && !validateTableReference(json, comp.dataSource.table)) {
        missingTables.add(comp.dataSource.table);
      }
      if (comp.children) {
        comp.children.forEach(checkComponent);
      }
    };

    screen.components.forEach(checkComponent);
  });

  return {
    missingScreens: Array.from(missingScreens),
    missingTables: Array.from(missingTables),
  };
}
