# WP Gestor — base de reconstrução Firebase

Este pacote é a primeira base técnica do novo WP Gestor. O HTML original foi preservado em `legacy/BASE PROATIVO 2.0.html`.

## O que já está preparado
- Projeto Vite com Firebase Authentication e Firestore.
- Tela de login por e-mail e senha.
- Perfis `superadmin`, `company_admin`, `usuario` e `lojas`.
- Tela inicial e cadastro básico de patrimônio vinculados à empresa/loja do usuário.
- Regras iniciais de isolamento por empresa e loja.
- Firebase Hosting e esqueleto de Cloud Functions para integração segura com Google Drive.

## O que ainda não está concluído
Este pacote **não é ainda a versão final pronta para produção**. Faltam a configuração real do Firebase, criação do primeiro Superadministrador, telas completas de gestão de empresas/lojas/usuários, edição/exclusão, importação/exportação, gráficos, trilha completa de auditoria, upload efetivo ao Google Drive e migração validada dos registros e fotos antigos.

As regras Firestore são um ponto de partida e precisam ser testadas no Emulator Suite antes de dados reais. A tela atual cobre login, leitura e cadastro inicial; não substitui todas as funções do HTML original.

## Requisitos
- Node.js 20 ou superior
- Conta Google para Firebase
- Firebase CLI (`npm install -g firebase-tools`)

## Configuração
1. Crie um projeto em https://console.firebase.google.com/.
2. Ative Authentication > Sign-in method > E-mail/Senha.
3. Crie o Firestore Database.
4. Em Configurações do projeto, copie o objeto de configuração Web para `src/firebase.js`.
5. Crie o primeiro usuário em Authentication.
6. Crie manualmente o documento `users/{UID}` no Firestore com:
   ```json
   {
     "name": "Administrador principal",
     "email": "seu-email",
     "role": "superadmin",
     "active": true
   }
   ```
7. Publique as regras:
   ```bash
   firebase login
   firebase use --add
   firebase deploy --only firestore:rules
   ```
8. Instale e rode:
   ```bash
   npm install
   npm run dev
   ```

## Estrutura inicial de dados
- `users/{uid}`: perfil global e papel.
- `companies/{companyId}`: empresas.
- `companies/{companyId}/members/{uid}`: papel e lojas autorizadas.
- `companies/{companyId}/stores/{storeId}`: lojas.
- `companies/{companyId}/stores/{storeId}/assets/{assetId}`: patrimônio.
- `.../assets/{assetId}/history/{historyId}`: histórico imutável de eventos.

### Papéis
- `superadmin`: administra todas as empresas.
- `company_admin`: administra a própria empresa, lojas, usuários e ativos.
- `usuario`: consulta os ativos das lojas autorizadas.
- `lojas`: cadastra ativos nas lojas autorizadas, sem consultar a base.

## Google Drive
O Drive será conectado por Cloud Functions usando credencial segura no servidor. Não coloque chave JSON, token ou segredo do Google no JavaScript do navegador nem no repositório. A conta central do Drive e o método de autorização precisam ser definidos antes de ativar o upload.

## Migração do HTML antigo
Não apague nem altere os dados do navegador antigo antes de fazer backup. A migração precisa:
1. Exportar backup JSON e planilha do sistema antigo.
2. Conferir duplicidades de etiqueta e registros sem tag.
3. Definir empresa e loja para cada registro.
4. Migrar os dados para Firestore.
5. Transferir fotos para pastas no Drive e salvar os IDs/links privados no Firestore.
6. Conferir quantidade de registros e abrir uma amostra de fotos antes de liberar o uso.

## Importante
O HTML antigo contém credenciais de demonstração e armazenamento local. Não use essas senhas como contas reais. Crie usuários novos no Firebase e revogue os acessos antigos após validar a migração.


## Nova identidade visual WP Gestor

Interface redesenhada com identidade premium em grafite, preto e dourado discreto:
- Tela de login institucional;
- Navegação lateral e cabeçalho;
- Dashboard com indicadores;
- Tela de patrimônio com pesquisa e cadastro;
- Estrutura visual para empresas, unidades, usuários, relatórios e configurações.

**Importante:** esta entrega é uma primeira versão visual e funcional da base. Os módulos indicados como “em desenvolvimento” ainda não possuem operações completas. Antes de vender, será necessário implementar e testar a administração multiempresa, cobrança recorrente, auditoria, integrações e regras de segurança em ambiente real.
