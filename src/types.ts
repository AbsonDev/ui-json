export type Layout = 'vertical' | 'horizontal' | 'grid';
export type Alignment = 'start' | 'center' | 'end' | 'space-between' | 'space-around';
export type FontWeight = 'normal' | 'bold' | 'light';
export type TextAlign = 'left' | 'center' | 'right';
export type InputType = 'text' | 'email' | 'password' | 'number' | 'phone' | 'url';
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text';
export type ButtonSize = 'small' | 'medium' | 'large';
export type ImageResizeMode = 'cover' | 'contain' | 'stretch' | 'center';
export type PopupVariant = 'alert' | 'confirm' | 'info';

// Base Component Interface
interface UIComponentBase {
  id: string;
  marginTop?: number | string;
  marginBottom?: number | string;
  marginLeft?: number | string;
  marginRight?: number | string;
  showIf?: 'session.isLoggedIn' | 'session.isLoggedOut';
}

// Visual Components
export interface UIText extends UIComponentBase {
  type: 'text';
  content: string;
  fontSize?: number | string;
  fontWeight?: FontWeight;
  color?: string;
  textAlign?: TextAlign;
}

export interface UIInput extends UIComponentBase {
  type: 'input';
  label?: string;
  placeholder?: string;
  inputType?: InputType;
  required?: boolean;
  defaultValue?: string;
  maxLength?: number;
  validation?: {
    pattern: string;
    errorMessage: string;
  };
  disabled?: boolean;
}

export interface UIButton extends UIComponentBase {
  type: 'button';
  text: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  action: UIAction;
}

export interface UIImage extends UIComponentBase {
  type: 'image';
  source: string;
  width?: number | string;
  height?: number | string;
  resizeMode?: ImageResizeMode;
  borderRadius?: number | string;
}

export interface UIList extends UIComponentBase {
  type: 'list';
  dataSource?: { table: string };
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    image?: string;
    icon?: string;
    badge?: string;
  }>;
  itemAction?: UIAction;
  emptyMessage?: string;
  separator?: boolean;
}

export interface UICard extends UIComponentBase {
  type: 'card';
  components: UIComponent[];
  elevation?: number;
  borderRadius?: number | string;
  padding?: number | string;
  backgroundColor?: string;
}

export interface UISelect extends UIComponentBase {
  type: 'select';
  label?: string;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  defaultValue?: string;
}

export interface UICheckbox extends UIComponentBase {
  type: 'checkbox';
  label: string;
  required?: boolean;
  defaultValue?: boolean;
}

export interface UIContainer extends UIComponentBase {
  type: 'container';
  layout?: Layout;
  alignment?: Alignment;
  components: UIComponent[];
  padding?: number | string;
  backgroundColor?: string;
}

export interface UIDivider extends UIComponentBase {
  type: 'divider';
  color?: string;
  thickness?: number | string;
}

export interface UIDatePicker extends UIComponentBase {
  type: 'datepicker';
  label?: string;
  required?: boolean;
  defaultValue?: string; // e.g., '2024-12-31'
  disabled?: boolean;
}

export interface UITimePicker extends UIComponentBase {
  type: 'timepicker';
  label?: string;
  required?: boolean;
  defaultValue?: string; // e.g., '23:59'
  disabled?: boolean;
}

// AI Components
export interface UIAIChat extends UIComponentBase {
  type: 'aichat';
  persona?: string; // AI personality/instructions
  welcomeMessage?: string;
  placeholder?: string;
  height?: number | string;
  showHistory?: boolean;
  maxMessages?: number;
}

export interface UIAIAssistant extends UIComponentBase {
  type: 'aiassistant';
  prompt: string; // The prompt template (can use {{field}} syntax)
  inputFields: string[]; // Form field IDs to use as input
  outputField: string; // Form field ID to save the result
  buttonText?: string;
  loadingText?: string;
  icon?: string;
}

export interface UIAIAnalyzer extends UIComponentBase {
  type: 'aianalyzer';
  analyzeType: 'text' | 'sentiment' | 'category' | 'summary';
  sourceField: string; // Field to analyze
  resultField: string; // Where to save result
  placeholder?: string;
  autoAnalyze?: boolean; // Analyze on blur/change
}


export type UIComponent =
  | UIText
  | UIInput
  | UIButton
  | UIImage
  | UIList
  | UICard
  | UISelect
  | UICheckbox
  | UIContainer
  | UIDivider
  | UIDatePicker
  | UITimePicker
  | UIAIChat
  | UIAIAssistant
  | UIAIAnalyzer;

// Actions
export interface NavigateAction {
  type: 'navigate';
  target: string;
  params?: Record<string, any>;
  transition?: 'slide' | 'fade' | 'modal';
}

export interface SubmitAction {
  type: 'submit';
  target?: 'api' | 'database';
  // API specific
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  // Database specific
  table?: string;
  // Common
  fields?: { [key: string]: string }; // maps db field to form field ID
  onSuccess?: UIAction;
  onError?: UIAction;
}

export interface PopupAction {
  type: 'popup';
  title?: string;
  message: string;
  variant?: PopupVariant;
  buttons?: Array<{ text: string, variant?: ButtonVariant, action?: UIAction }>;
}

export interface OpenUrlAction {
  type: 'openUrl';
  url: string;
  external?: boolean;
}

export interface GoBackAction {
  type: 'goBack';
}

export interface SetValueAction {
  type: 'setValue';
  targetId: string;
  value: any;
}

export interface DeleteRecordAction {
    type: 'deleteRecord';
    table: string;
    recordId: string; // The ID of the record to delete
}

// Authentication Actions
export interface LoginAction {
  type: 'auth:login';
  fields: {
    email: string;
    password: string;
  };
  onError?: UIAction;
}

export interface SignupAction {
  type: 'auth:signup';
  fields: {
    email: string;
    password: string;
    [key: string]: string; // Allow other fields
  };
  onError?: UIAction;
}

export interface LogoutAction {
  type: 'auth:logout';
  onSuccess?: UIAction;
}

// AI Action
export interface AIAction {
  type: 'ai';
  aiAction: 'chat' | 'analyze' | 'suggest' | 'classify' | 'generate';
  prompt: string; // Can use {{fieldId}} template syntax
  context?: Record<string, string>; // Additional context fields
  saveToField?: string; // Field ID to save the result
  persona?: string; // AI personality/instructions
  onSuccess?: UIAction;
  onError?: UIAction;
}


export type UIAction =
  | NavigateAction
  | SubmitAction
  | PopupAction
  | OpenUrlAction
  | GoBackAction
  | SetValueAction
  | DeleteRecordAction
  | LoginAction
  | SignupAction
  | LogoutAction
  | AIAction;

// Screen and App structure
export interface UIScreen {
  id: string;
  title?: string;
  layout?: Layout;
  padding?: number | string;
  backgroundColor?: string;
  components: UIComponent[];
  params?: string[];
  requiresAuth?: boolean;
}

export interface UITheme {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
}

export interface AuthenticationConfig {
    enabled: boolean;
    userTable: string; // e.g., 'users'
    emailField: string; // e.g., 'email'
    passwordField: string; // e.g., 'password'
    postLoginScreen: string; // screen to navigate to after successful login
    authRedirectScreen: string; // screen to redirect to if auth is required
}

export interface UIApp {
  version: string;
  app: {
    name: string;
    theme?: UITheme;
    designTokens?: Record<string, string | number>;
    databaseSchema?: any;
    authentication?: AuthenticationConfig;
  };
  screens: Record<string, UIScreen>;
  initialScreen: string;
}