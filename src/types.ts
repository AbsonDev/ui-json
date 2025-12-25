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
  | UITimePicker;

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
  | LogoutAction;

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

// ============================================
// Backend as a Service (BaaS) Types
// ============================================

// Field types supported by BaaS
export type EntityFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'email'
  | 'url'
  | 'text'      // Long text
  | 'json'      // JSON object
  | 'relation'; // Relation to another entity

// Validation rule types
export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'email' | 'url' | 'unique' | 'custom';
  value?: any;
  message?: string;
}

// Entity field definition
export interface EntityField {
  name: string;
  type: EntityFieldType;
  displayName?: string;
  description?: string;
  required?: boolean;
  unique?: boolean;
  defaultValue?: any;
  validation?: ValidationRule[];

  // For relations
  relationTo?: string;      // Entity name
  relationType?: '1:1' | '1:N' | 'N:N';

  // UI hints
  placeholder?: string;
  helpText?: string;

  // Advanced options
  indexed?: boolean;
  searchable?: boolean;
  sortable?: boolean;
}

// Permission types for entities
export type EntityPermission = 'public' | 'authenticated' | 'owner' | 'admin';
export type EntityWritePermission = 'authenticated' | 'owner' | 'admin';

// Entity definition
export interface Entity {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  fields: EntityField[];
  timestamps?: boolean;
  softDelete?: boolean;
  readPermission?: EntityPermission;
  writePermission?: EntityWritePermission;
  deletePermission?: EntityWritePermission;
  appId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Entity data record
export interface EntityData {
  id: string;
  entityId: string;
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// API Request/Response types
export interface CreateEntityRequest {
  name: string;
  displayName?: string;
  description?: string;
  fields: EntityField[];
  timestamps?: boolean;
  softDelete?: boolean;
  readPermission?: EntityPermission;
  writePermission?: EntityWritePermission;
  deletePermission?: EntityWritePermission;
}

export interface UpdateEntityRequest {
  displayName?: string;
  description?: string;
  fields?: EntityField[];
  timestamps?: boolean;
  softDelete?: boolean;
  readPermission?: EntityPermission;
  writePermission?: EntityWritePermission;
  deletePermission?: EntityWritePermission;
}

export interface CreateEntityDataRequest {
  data: Record<string, any>;
}

export interface UpdateEntityDataRequest {
  data: Record<string, any>;
}

export interface QueryEntityDataRequest {
  where?: Record<string, any>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

export interface EntityDataResponse {
  id: string;
  data: Record<string, any>;
  appUserId?: string; // Optional - set when data is owned by an app user
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface EntityResponse {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  fields: EntityField[];
  timestamps: boolean;
  softDelete: boolean;
  readPermission: EntityPermission;
  writePermission: EntityWritePermission;
  deletePermission: EntityWritePermission;
  recordCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface BaaSErrorResponse {
  error: string;
  message: string;
  details?: any;
}

// ============================================
// App User Authentication Types
// ============================================

export interface AppUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  emailVerified: boolean;
  appId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date | null;
}

export interface AppSession {
  id: string;
  token: string;
  expiresAt: Date;
  appUserId: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
  lastUsedAt: Date;
}

// Auth Request/Response types
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  metadata?: Record<string, any>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AppUserResponse;
  token?: string;
  expiresAt?: string;
  error?: string;
}

export interface AppUserResponse {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  emailVerified: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
}

export interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
  metadata?: Record<string, any>;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface VerifyEmailRequest {
  token: string;
}

// ============================================
// File Storage Types
// ============================================

export interface File {
  id: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  thumbnailPath?: string | null;
  thumbnailUrl?: string | null;
  width?: number | null;
  height?: number | null;
  isPublic: boolean;
  appId: string;
  appUserId?: string | null;
  userId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileResponse {
  id: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string | null;
  width?: number | null;
  height?: number | null;
  isPublic: boolean;
  appUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadFileRequest {
  isPublic?: boolean;
}

export interface UploadFileResponse {
  success: boolean;
  file?: FileResponse;
  error?: string;
}

export interface ListFilesRequest {
  limit?: number;
  offset?: number;
  mimeType?: string; // Filter by mime type (e.g., "image/*")
  appUserId?: string; // Filter by app user (admin only)
}

export interface FileQuota {
  used: number;      // Bytes used
  limit: number;     // Bytes limit
  count: number;     // Number of files
  countLimit: number; // Max number of files
}

export interface FileQuotaResponse {
  success: boolean;
  quota?: FileQuota;
  error?: string;
}

// Allowed file types and limits
export const FILE_UPLOAD_CONFIG = {
  // Max file size: 10MB
  MAX_FILE_SIZE: 10 * 1024 * 1024,

  // Max total storage per app user: 100MB
  MAX_STORAGE_PER_USER: 100 * 1024 * 1024,

  // Max files per app user: 100
  MAX_FILES_PER_USER: 100,

  // Allowed mime types
  ALLOWED_MIME_TYPES: [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',

    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

    // Audio
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',

    // Video
    'video/mp4',
    'video/mpeg',
    'video/webm',
    'video/quicktime',

    // Archives
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
  ],

  // Thumbnail settings
  THUMBNAIL_WIDTH: 200,
  THUMBNAIL_HEIGHT: 200,
  THUMBNAIL_QUALITY: 80,
} as const;