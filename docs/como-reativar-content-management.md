# Como Reativar o Gerenciamento de Conteúdo

Este documento explica como reativar o módulo de gerenciamento de conteúdo que foi temporariamente desativado.

## Instruções para Reativação

Para reativar o gerenciamento de conteúdo, siga os passos abaixo:

### 1. Editar o arquivo App.js

Abra o arquivo `/home/m/luz.ia_v7/client/src/App.js` e localize a seção de rotas administrativas. Descomente a linha relacionada à rota `/admin/content`:

```javascript
// De:
{/* Rota temporariamente desativada para o gerenciamento de conteúdo */}
{/* <Route path="/admin/content" element={<ProtectedRoute element={<ContentManagement />} requiredRole="admin" />} /> */}

// Para:
<Route path="/admin/content" element={<ProtectedRoute element={<ContentManagement />} requiredRole="admin" />} />
```

### 2. Reiniciar o servidor de desenvolvimento

Após fazer esta alteração, reinicie o servidor de desenvolvimento do React:

```bash
cd /home/m/luz.ia_v7/client
npm start
```

### 3. Verificar a ativação

Acesse o painel administrativo em:
- URL: `http://localhost:3000/admin`
- Navegue até a seção de gerenciamento de conteúdo (`/admin/content`)

## Sobre o Gerenciamento de Conteúdo

O módulo de gerenciamento de conteúdo permite:

1. **Adicionar novos conteúdos** de diferentes tipos:
   - Artigos
   - Vídeos
   - E-books
   - Galerias

2. **Categorizar conteúdos**:
   - Manifestação
   - Práticas Guiadas
   - Diário Quântico
   - Desenvolvimento Pessoal

3. **Gerenciar status**:
   - Publicado (published)
   - Rascunho (draft)
   - Arquivado (archived)

### Importante: Práticas Guiadas

Para que os conteúdos apareçam na página de Práticas Guiadas (`/praticas`):

1. Selecione a categoria **"Práticas Guiadas"** ao criar o conteúdo
2. Defina o status como **"published"** (publicado)
3. Faça upload de uma imagem
4. Opcionalmente, forneça uma URL de conteúdo para redirecionamento

Estes conteúdos serão exibidos tanto:
- Na página de práticas para os usuários (`/praticas`)
- No painel administrativo de práticas (`/admin/praticas`)

## Observações Técnicas

- O gerenciamento de conteúdo usa o modelo `Content` no MongoDB
- As imagens são armazenadas no MinIO
- A rota da API para gerenciamento de conteúdos é `/api/contents`
