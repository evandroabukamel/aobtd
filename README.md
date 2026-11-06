# Monitor de quedas de aeronaves

Página web com um mapa das quedas de **aeronaves tripuladas** nas últimas 24 horas, no mês atual e em cada mês de qualquer ano, com contadores ao lado do mapa. Ao clicar num marcador, aparece a lista de notícias e comunicados oficiais que citam o acidente.

A coleta é feita por um **servidor MCP**, que varre cada fonte uma vez por dia e grava tudo no **PostgreSQL**.

## Arquitetura

```
apps/collector   Servidor MCP + agendador: lê as fontes, filtra, geocodifica e grava
apps/api         API HTTP (Fastify) que também serve o site em produção
apps/web         Site em React + Vite + Leaflet
packages/core    Tipos compartilhados, conexão e migrações do banco
```

```
fontes (RSS/Atom/HTML) ──► collector (MCP) ──► PostgreSQL ◄── api ◄── web
                                  ▲
                    cliente MCP (Claude, etc.)
```

### Agenda de coleta

Cada fonte pertence a uma de quatro janelas diárias: **00h, 06h, 12h e 18h UTC** (coluna `sources.scan_slot`). Assim cada site é varrido **uma vez por dia**, e há 6h entre um grupo de fontes e o seguinte.

O controle fica no banco: antes de varrer, o coletor "reserva" a fonte com um `UPDATE` atômico que só passa se ela ainda não foi varrida no período. Reiniciar o processo ou subir mais de uma instância não gera varreduras extras, e uma janela perdida com o servidor desligado é recuperada quando ele volta.

### Como uma notícia vira um marcador

1. **Download econômico:** GET condicional (`ETag`/`Last-Modified`), limite de tamanho e timeout. URLs já gravadas são descartadas antes de qualquer processamento.
2. **Filtro por regras, sem LLM** (custo zero de tokens): a notícia precisa citar uma aeronave e uma queda (em português, inglês, francês ou alemão) e não pode tratar de drones, aeromodelos, mísseis, satélites etc.
3. **Extração:** local, número de vítimas, modelo da aeronave e data ("ontem" é ajustado).
4. **Geocodificação** pelo Nominatim (OpenStreetMap), no máximo 1 consulta por segundo e com cache permanente no banco (inclusive para locais não encontrados). Notícias sem local identificável não entram no mapa.
5. **Agrupamento:** notícias a até 60 km e 48h uma da outra viram o mesmo acidente, que passa a listar todas as fontes.

### Fontes

| Janela | Fonte | Tipo | Como é lida |
|---|---|---|---|
| 00h | Aviation Safety Network (Flight Safety Foundation) | Base de dados | Lista do Wikibase (HTML), só danos `w/o` e `sub` |
| 00h | BBC News | Agência | RSS |
| 00h | CENIPA (FAB) | Órgão oficial | Busca RSS do Google News |
| 06h | Reuters | Agência | Busca RSS do Google News (`site:reuters.com`) |
| 06h | NTSB (EUA) | Órgão oficial | Busca RSS do Google News |
| 06h | BEA (França) | Órgão oficial | Busca RSS do Google News |
| 12h | Associated Press | Agência | Busca RSS do Google News (`site:apnews.com`) |
| 12h | AAIB (Reino Unido) | Órgão oficial | Atom do gov.uk |
| 12h | TSB (Canadá) | Órgão oficial | Busca RSS do Google News |
| 18h | Agência Brasil (EBC) | Agência | RSS |
| 18h | ATSB (Austrália) | Órgão oficial | Busca RSS do Google News |
| 18h | FAA (EUA) | Órgão oficial | Busca RSS do Google News |
| 18h | BFU (Alemanha) | Órgão oficial | Busca RSS do Google News |

Reuters, AP e a maioria dos órgãos de investigação não publicam RSS próprio; para eles a busca do Google News já filtra por acidentes e devolve poucos itens. As fontes ficam na tabela `sources` e podem ser ligadas, desligadas ou trocadas de janela sem mudar código.

## Como rodar

### Com Docker

```bash
docker compose up --build
```

- Site e API: http://localhost:3000
- Servidor MCP (Streamable HTTP): http://localhost:3333/mcp

### Em desenvolvimento

Requer Node.js 20.11+ e PostgreSQL 14+.

```bash
cp .env.example .env          # ajuste DATABASE_URL
npm install
npm run db:migrate
npm run dev:api               # API em :3000
npm run dev:web               # site em :5173 (proxy para a API)
npm run dev:collector         # coletor MCP em :3333 com o agendador ligado
```

### Ligando o MCP a um cliente

Por stdio (o cliente inicia o processo):

```json
{
  "mcpServers": {
    "aobtd": {
      "command": "node",
      "args": ["/caminho/para/aobtd/apps/collector/dist/index.js"],
      "env": { "DATABASE_URL": "postgres://aobtd:aobtd@localhost:5432/aobtd", "COLLECTOR_SCHEDULER": "off" }
    }
  }
}
```

Use `COLLECTOR_SCHEDULER=off` quando outro processo (por exemplo o container `collector`) já cuida do agendamento.

Ferramentas expostas, todas com respostas curtas (uma linha por item):

| Ferramenta | O que faz |
|---|---|
| `list_sources` | Fontes, janela, última e próxima varredura |
| `run_due_scans` | Varre as fontes cuja janela chegou |
| `scan_source` | Varre uma fonte (`force: true` ignora o limite diário) |
| `query_accidents` | Lista acidentes das últimas 24h, do mês ou de um ano/mês |

## API

| Rota | Resposta |
|---|---|
| `GET /api/accidents?period=24h` | Marcadores das últimas 24h |
| `GET /api/accidents?period=month[&year=2026][&month=3]` | Mês atual, um mês ou um ano inteiro (sem `month`) |
| `GET /api/stats?year=2026` | Contadores: 24h, mês atual, total do ano, 12 meses e anos disponíveis |
| `GET /api/accidents/:id` | Detalhes e lista de fontes do acidente |

Os marcadores vêm como tuplas `[id, lat, lng, vítimas, epoch]` para reduzir o tamanho da resposta. As respostas têm `ETag` e `Cache-Control`.

## Organização do site (`apps/web`)

O frontend segue Clean Architecture: as dependências apontam sempre para dentro (`presentation` → `application` → `domain`), e só a raiz de composição (`app/`) conhece a implementação HTTP.

```
src/
  domain/            Regras puras, sem React: filtros, calendário UTC, entidades
  application/       Casos de uso em hooks: estado da tela e consultas (TanStack Query)
    ports/           Interface AccidentRepository (o que a aplicação precisa da API)
  infrastructure/    Implementações das portas: repositório sobre fetch
  presentation/      React, organizado em Atomic Design
    components/
      atoms/         ToggleButton, CloseButton, Badge, StatusMessage, BarMeter
      molecules/     StatCard, MonthBar, YearSelect, FactList, SourceItem, MapCaption
      organisms/     AppHeader, CountersPanel, AccidentPanel, CrashMap
      templates/     DashboardTemplate (cabeçalho, mapa e barra lateral)
    pages/           DashboardPage: liga estado e consultas aos componentes
    shared/          Formatação (datas, meses, rótulos)
  app/               Raiz de composição: QueryClient e injeção do repositório
  main.tsx           Ponto de entrada
```

Átomos, moléculas, organismos e templates só recebem dados por props; quem busca dados é a página. Para trocar a origem dos dados (outra API, dados de teste), basta outra implementação de `AccidentRepository` passada em `app/App.tsx`.

## Desempenho no site

- Leaflet em renderização por canvas: milhares de marcadores sem um nó DOM por marcador.
- Mapa num chunk separado, carregado sob demanda; o painel de contadores aparece antes.
- Todos os contadores numa única requisição; a lista de fontes só é buscada ao clicar.
- Cache no cliente (TanStack Query) de 6h por filtro, alinhado à janela de coleta: voltar a um filtro já consultado não gera nova requisição.

## Testes

```bash
npm test                                                     # testes de unidade
TEST_DATABASE_URL=postgres://.../aobtd_test npm test         # inclui integração (apaga o schema public desse banco!)
```

## Limitações conhecidas

- A extração de local é feita por regras; títulos sem nome de lugar ficam fora do mapa (são contados no resumo da varredura como "sem local").
- As URLs das fontes não puderam ser validadas no ambiente onde o projeto foi criado. Depois da primeira varredura, `list_sources` mostra o status de cada uma.
- A lista da ASN é lida pelo cabeçalho da tabela; se o layout mudar muito, o parser em `apps/collector/src/parsers/asn.ts` precisa de ajuste.
