# File Storage & Management - Guia Completo

## Índice

1. [Visão Geral](#visão-geral)
2. [Configuração](#configuração)
3. [Upload de Arquivos](#upload-de-arquivos)
4. [Download e Acesso](#download-e-acesso)
5. [Gerenciamento](#gerenciamento)
6. [Quotas e Limites](#quotas-e-limites)
7. [Segurança](#segurança)
8. [Exemplos Práticos](#exemplos-práticos)

---

## Visão Geral

O sistema de File Storage permite que apps móveis façam upload, armazenamento e gerenciamento de arquivos (imagens, documentos, vídeos, áudio).

### Características

- ✅ Upload de múltiplos tipos de arquivo (20+ formatos)
- ✅ Validação automática de tipo e tamanho
- ✅ Sistema de quota por usuário
- ✅ Ownership automática (isolamento por app user)
- ✅ Permissões (public/private)
- ✅ Metadados completos (dimensões, mime type, etc.)
- ✅ URLs públicas para acesso direto
- ✅ **Thumbnails automáticos** para imagens (200x200px, JPEG quality 80)
- ✅ **Dimensões automáticas** (width/height) para imagens

### Tipos de Arquivo Suportados

**Imagens:**
- JPEG, JPG, PNG, GIF, WebP, SVG

**Documentos:**
- PDF, DOC, DOCX, XLS, XLSX

**Áudio:**
- MP3, WAV, OGG

**Vídeo:**
- MP4, MPEG, WebM, QuickTime (MOV)

**Arquivos:**
- ZIP, RAR

---

## Configuração

### Limites Padrão

```typescript
// Definidos em src/types.ts
const FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024,        // 10MB por arquivo
  MAX_STORAGE_PER_USER: 100 * 1024 * 1024, // 100MB total por usuário
  MAX_FILES_PER_USER: 100,                 // 100 arquivos por usuário
};
```

### Estrutura de Armazenamento

Arquivos são salvos em: `public/uploads/`

Exemplo de estrutura:
```
public/
  uploads/
    1735123456789-a1b2c3d4e5f6.jpg
    1735123457890-f6e5d4c3b2a1.pdf
    1735123458991-1a2b3c4d5e6f.mp4
```

---

## Upload de Arquivos

### API Endpoint

**POST** `/api/apps/{appId}/files`

### Headers

```http
Content-Type: multipart/form-data
Authorization: Bearer {app_user_token}  # Opcional
```

### Body (FormData)

```typescript
{
  file: File,           // Obrigatório
  isPublic: boolean     // Opcional (default: false)
}
```

### Response (201 Created)

```json
{
  "file": {
    "id": "file_abc123",
    "originalName": "foto-perfil.jpg",
    "filename": "1735123456789-a1b2c3d4e5f6.jpg",
    "mimeType": "image/jpeg",
    "size": 524288,
    "url": "/uploads/1735123456789-a1b2c3d4e5f6.jpg",
    "thumbnailUrl": "/uploads/1735123456789-a1b2c3d4e5f6-thumb.jpg",
    "width": 1920,
    "height": 1080,
    "isPublic": false,
    "appUserId": "user_xyz789",
    "createdAt": "2024-12-25T10:30:45.000Z",
    "updatedAt": "2024-12-25T10:30:45.000Z"
  }
}
```

**Nota**: Para imagens, `thumbnailUrl`, `width` e `height` são preenchidos automaticamente.

### Exemplo: JavaScript/TypeScript

```typescript
// Upload de imagem
const uploadImage = async (appId: string, file: File, token: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('isPublic', 'false');

  const response = await fetch(`/api/apps/${appId}/files`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const { file: uploadedFile } = await response.json();
  return uploadedFile;
};
```

### Exemplo: React Native

```typescript
import * as ImagePicker from 'expo-image-picker';

const pickAndUploadImage = async () => {
  // 1. Pick image from gallery
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });

  if (result.canceled) return;

  // 2. Prepare form data
  const formData = new FormData();
  formData.append('file', {
    uri: result.assets[0].uri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any);
  formData.append('isPublic', 'false');

  // 3. Upload
  const response = await fetch(`${API_URL}/api/apps/${appId}/files`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const { file } = await response.json();
  console.log('Uploaded:', file.url);
};
```

### Validações

O sistema valida automaticamente:

1. **Tipo de arquivo** - Apenas tipos permitidos
2. **Tamanho** - Máximo 10MB
3. **Quota de armazenamento** - Máximo 100MB por usuário
4. **Quota de arquivos** - Máximo 100 arquivos por usuário

### Erros Comuns

```json
// Tipo não permitido
{
  "error": "File type application/exe is not allowed. Allowed types: images, documents, audio, video, archives."
}

// Arquivo muito grande
{
  "error": "File size 15728640 bytes exceeds maximum allowed size of 10485760 bytes (10MB)."
}

// Quota excedida
{
  "error": "Storage quota exceeded. Used: 95000000 bytes, Limit: 104857600 bytes."
}

// Limite de arquivos
{
  "error": "File count limit reached. You have 100 files (max: 100)."
}
```

---

## Download e Acesso

### Arquivos Privados (isPublic: false)

Requerem autenticação para acesso. O app deve:

1. Obter metadados do arquivo via API
2. Baixar usando o token de autenticação

```typescript
const getPrivateFile = async (appId: string, fileId: string, token: string) => {
  // 1. Get file metadata
  const response = await fetch(`/api/apps/${appId}/files/${fileId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const { file } = await response.json();

  // 2. Download file (Next.js serve static files from /public)
  // No React Native, use FileSystem or similar
  return file.url; // "/uploads/1735123456789-a1b2c3d4e5f6.jpg"
};
```

### Arquivos Públicos (isPublic: true)

Podem ser acessados diretamente via URL, sem autenticação:

```html
<img src="https://your-domain.com/uploads/1735123456789-a1b2c3d4e5f6.jpg" />
```

---

## Gerenciamento

### Listar Arquivos

**GET** `/api/apps/{appId}/files`

#### Query Parameters

- `limit` - Número de arquivos por página (default: 50)
- `offset` - Offset para paginação (default: 0)
- `mimeType` - Filtrar por tipo (ex: "image/*" ou "image/jpeg")

#### Headers

```http
Authorization: Bearer {app_user_token}  # Opcional - filtra por usuário
```

#### Response

```json
{
  "files": [
    {
      "id": "file_abc123",
      "originalName": "foto1.jpg",
      "filename": "1735123456789-a1b2c3d4e5f6.jpg",
      "mimeType": "image/jpeg",
      "size": 524288,
      "url": "/uploads/1735123456789-a1b2c3d4e5f6.jpg",
      "isPublic": false,
      "appUserId": "user_xyz789",
      "createdAt": "2024-12-25T10:30:45.000Z",
      "updatedAt": "2024-12-25T10:30:45.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

#### Exemplo: Listar Apenas Imagens

```typescript
const listImages = async (appId: string, token: string) => {
  const response = await fetch(
    `/api/apps/${appId}/files?mimeType=image/*&limit=20`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const { files } = await response.json();
  return files;
};
```

### Obter Arquivo Específico

**GET** `/api/apps/{appId}/files/{fileId}`

```typescript
const getFile = async (appId: string, fileId: string) => {
  const response = await fetch(`/api/apps/${appId}/files/${fileId}`);
  const { file } = await response.json();
  return file;
};
```

### Deletar Arquivo

**DELETE** `/api/apps/{appId}/files/{fileId}`

#### Headers

```http
Authorization: Bearer {app_user_token}  # Opcional - valida ownership
```

#### Response

```json
{
  "message": "File deleted successfully"
}
```

#### Exemplo

```typescript
const deleteFile = async (appId: string, fileId: string, token: string) => {
  const response = await fetch(`/api/apps/${appId}/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const { error } = await response.json();
    throw new Error(error);
  }

  return true;
};
```

---

## Quotas e Limites

### Verificar Quota

**GET** `/api/apps/{appId}/files/quota`

#### Headers (Obrigatório)

```http
Authorization: Bearer {app_user_token}
```

#### Response

```json
{
  "quota": {
    "used": 52428800,        // 50MB em bytes
    "limit": 104857600,      // 100MB em bytes
    "count": 45,             // 45 arquivos
    "countLimit": 100        // Máximo 100 arquivos
  }
}
```

#### Exemplo de Uso

```typescript
const checkQuota = async (appId: string, token: string) => {
  const response = await fetch(`/api/apps/${appId}/files/quota`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const { quota } = await response.json();

  const usedPercent = (quota.used / quota.limit) * 100;
  console.log(`Storage: ${usedPercent.toFixed(1)}% used`);
  console.log(`Files: ${quota.count}/${quota.countLimit}`);

  return quota;
};
```

#### Exemplo: UI com Progress Bar

```tsx
const QuotaDisplay = () => {
  const [quota, setQuota] = useState<FileQuota | null>(null);

  useEffect(() => {
    checkQuota(appId, token).then(setQuota);
  }, []);

  if (!quota) return <div>Loading...</div>;

  const usedPercent = (quota.used / quota.limit) * 100;

  return (
    <div>
      <h3>Storage Usage</h3>
      <div className="progress-bar">
        <div style={{ width: `${usedPercent}%` }} />
      </div>
      <p>
        {formatFileSize(quota.used)} / {formatFileSize(quota.limit)}
        ({usedPercent.toFixed(1)}%)
      </p>
      <p>Files: {quota.count}/{quota.countLimit}</p>
    </div>
  );
};
```

---

## Segurança

### Ownership e Isolamento

1. **Upload com Token** → Arquivo é automaticamente associado ao app user
2. **Listagem com Token** → Retorna apenas arquivos do usuário
3. **Deleção** → Valida que o arquivo pertence ao usuário

### Permissões

#### Arquivos Privados (isPublic: false)

- Apenas o dono pode acessar
- Admin do app pode visualizar via dashboard
- Ideal para: fotos de perfil, documentos pessoais

#### Arquivos Públicos (isPublic: true)

- Qualquer um pode acessar via URL
- Não requer autenticação
- Ideal para: produtos em e-commerce, posts públicos

### Validação de Tipo

O sistema apenas aceita tipos específicos definidos em `FILE_UPLOAD_CONFIG.ALLOWED_MIME_TYPES`.

**Tipos bloqueados** (por segurança):
- Executáveis (.exe, .sh, .bat)
- Scripts (.js, .php, .py - exceto como texto)
- Binários desconhecidos

### Validação de Tamanho

- **Máximo por arquivo**: 10MB
- **Máximo total por usuário**: 100MB

---

## Exemplos Práticos

### Caso 1: Upload de Foto de Perfil

```typescript
const updateProfilePicture = async (file: File) => {
  // 1. Upload image
  const uploadedFile = await uploadImage(appId, file, token);

  // 2. Update user profile with file ID
  await updateProfile(token, {
    avatar: uploadedFile.url
  });

  return uploadedFile.url;
};
```

### Caso 2: Galeria de Fotos

```tsx
const PhotoGallery = () => {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    // List all images
    listImages(appId, token).then(setPhotos);
  }, []);

  const handleUpload = async (file: File) => {
    const uploaded = await uploadImage(appId, file, token);
    setPhotos([uploaded, ...photos]);
  };

  const handleDelete = async (fileId: string) => {
    await deleteFile(appId, fileId, token);
    setPhotos(photos.filter(p => p.id !== fileId));
  };

  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />

      <div className="gallery">
        {photos.map(photo => (
          <div key={photo.id}>
            <img src={photo.url} alt={photo.originalName} />
            <button onClick={() => handleDelete(photo.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Caso 3: Upload com Progress

```typescript
const uploadWithProgress = async (file: File, onProgress: (percent: number) => void) => {
  const formData = new FormData();
  formData.append('file', file);

  const xhr = new XMLHttpRequest();

  // Track upload progress
  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) {
      const percent = (e.loaded / e.total) * 100;
      onProgress(percent);
    }
  });

  return new Promise((resolve, reject) => {
    xhr.addEventListener('load', () => {
      if (xhr.status === 201) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(xhr.statusText));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload failed')));

    xhr.open('POST', `/api/apps/${appId}/files`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
};
```

### Caso 4: E-Commerce - Upload de Foto de Produto

```typescript
const createProduct = async (productData: any, imageFile: File) => {
  // 1. Upload product image (public)
  const formData = new FormData();
  formData.append('file', imageFile);
  formData.append('isPublic', 'true'); // Public image

  const response = await fetch(`/api/apps/${appId}/files`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    },
    body: formData
  });

  const { file } = await response.json();

  // 2. Create product with image reference
  await fetch(`/api/apps/${appId}/entities/${productEntityId}/data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      data: {
        name: productData.name,
        price: productData.price,
        imageUrl: file.url,  // Public URL
        imageId: file.id
      }
    })
  });
};
```

---

## Próximas Features (Roadmap)

- ✅ **Geração de Thumbnails** - Automática para imagens (**IMPLEMENTADO**)
- ✅ **Dimensões de Imagem** - Width e height automáticos (**IMPLEMENTADO**)
- 🔄 **Storage em S3** - Suporte a AWS S3, Cloudflare R2
- 🔄 **Compressão de Imagens** - Otimização automática antes do upload
- 🔄 **Múltiplos Tamanhos** - Gerar vários tamanhos (small, medium, large)
- 🔄 **Metadata de Vídeo** - Duração, codec, resolução
- 🔄 **Streaming de Vídeo** - Suporte a HLS/DASH
- 🔄 **CDN Integration** - Distribuição via CDN
- 🔄 **Watermark** - Adicionar marca d'água em imagens

---

## Troubleshooting

### Problema: "File type not allowed"

**Solução**: Verifique o mime type do arquivo. Apenas os tipos listados em `FILE_UPLOAD_CONFIG.ALLOWED_MIME_TYPES` são permitidos.

### Problema: "Storage quota exceeded"

**Solução**:
1. Verifique quota atual: `GET /api/apps/{appId}/files/quota`
2. Delete arquivos antigos se necessário
3. Ou aumente o limite (configurável em `FILE_UPLOAD_CONFIG`)

### Problema: Arquivo não aparece após upload

**Solução**:
1. Verifique se o upload retornou sucesso (201 status)
2. Verifique o campo `appUserId` - arquivo pode estar associado a outro usuário
3. Tente listar sem filtros: `GET /api/apps/{appId}/files`

### Problema: "Unauthorized" ao acessar arquivo

**Solução**:
1. Arquivos privados requerem token de autenticação
2. Verifique se o arquivo pertence ao usuário autenticado
3. Ou marque arquivo como público (`isPublic: true`)

---

## Referência de API

### Resumo de Endpoints

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/apps/{appId}/files` | Upload file | Opcional |
| GET | `/api/apps/{appId}/files` | List files | Opcional |
| GET | `/api/apps/{appId}/files/{fileId}` | Get file metadata | Admin |
| DELETE | `/api/apps/{appId}/files/{fileId}` | Delete file | Opcional |
| GET | `/api/apps/{appId}/files/quota` | Get quota | Requerido |

---

**Versão**: 1.0.0
**Data**: 2024-12-25
**Status**: ✅ Implementado e Pronto para Uso
