# Job Apply Tracker Frontend

[Backend Spring Boot](https://github.com/vitorhugo-java/SpringBoot-JobApplyTracker/)

Aplicação frontend do Job Apply Tracker, construída com React + Vite para gerenciar candidaturas, acompanhar status do processo seletivo, lembretes e métricas no dashboard.

## Stack

- React 19
- Vite 7
- React Router 7
- Zustand (estado de autenticação e preferências)
- Axios (cliente HTTP com interceptors)
- PrimeReact + PrimeIcons
- Tailwind CSS
- Playwright (testes E2E)
- PWA via `vite-plugin-pwa`

## Visão Geral

O frontend consome a API do backend Spring Boot e oferece:

- autenticação com JWT e refresh token
- telas protegidas por rota autenticada
- CRUD de candidaturas
- dashboard com resumo de métricas
- lembretes de follow-up
- preferências de conta e tema

## Estrutura do Projeto

```text
src/
	api/                 # Camada de acesso HTTP (auth, applications, dashboard)
	components/          # Componentes reutilizáveis e layout
		layout/            # Sidebar, navegação móvel, layout protegido
		ui/                # EmptyState, badges, skeletons, etc.
	hooks/               # Hooks customizados
	pages/               # Páginas por domínio (auth, applications, dashboard...)
	store/               # Zustand store (auth, tokens, tema)
	utils/               # Logger, performance, helpers de exibição
	App.jsx              # Rotas públicas e privadas
	main.jsx             # Bootstrap da aplicação
tests/                 # Testes E2E com Playwright
```

## Fluxo de Autenticação

- Tokens e usuário são persistidos em `auth-storage` (localStorage) via Zustand persist.
- O app tenta restaurar sessão no carregamento (`/auth/me` e refresh se necessário).
- Requisições usam interceptor Axios com `Authorization: Bearer <token>`.
- Em erro `401/403`, o cliente tenta refresh automático.
- Falha definitiva de refresh encerra sessão e redireciona para `/login`.

## Rotas Principais

Públicas:

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`

Protegidas:

- `/dashboard`
- `/applications`
- `/applications/new`
- `/applications/:id`
- `/applications/:id/edit`
- `/reminders`
- `/developer`
- `/about`
- `/account`

## Pré-requisitos

- Node.js 20+
- npm 10+
- Backend disponível em `http://localhost:8080` (padrão)

## Configuração de Ambiente

Variáveis relevantes:

- `VITE_API_URL`: base da API sem `/api` (padrão: `http://localhost:8080`)
- `VITE_BASE_PATH`: base path de deploy do app (padrão: `/`)
- `API_TARGET`: alvo do proxy de desenvolvimento no Vite (padrão: `http://localhost:8080`)

Exemplo (`.env`):

```env
VITE_API_URL=http://localhost:8080
VITE_BASE_PATH=/
API_TARGET=http://localhost:8080
```

## Rodando Localmente

```bash
npm install
npm run dev
```

Aplicação disponível em `http://localhost:5173`.

## Scripts Disponíveis

```bash
npm run dev              # Desenvolvimento
npm run build            # Build de produção
npm run preview          # Preview do build
npm run lint             # ESLint
npm run test:e2e         # Testes E2E Playwright
npm run test:e2e:ui      # Playwright UI mode
npm run test:e2e:debug   # Playwright debug mode
npm run test:e2e:report  # Abre relatório Playwright
```

## Docker

Build e execução do frontend com Nginx:

```bash
docker compose up --build
```

O `Dockerfile` aceita build arg `VITE_API_URL` para apontar o backend em tempo de build.

## Testes E2E

Os testes ficam em `tests/` e usam Playwright com execução serial (`workers: 1`) para maior estabilidade.

Para executar:

```bash
npm run test:e2e
```

Relatório HTML:

```bash
npm run test:e2e:report
```

## Integração com Backend

- Este frontend consome endpoints em `/api` da API Spring Boot.
- O backend esperado está no diretório irmão: [../SpringBoot-JobApplyTracker](../SpringBoot-JobApplyTracker/).
