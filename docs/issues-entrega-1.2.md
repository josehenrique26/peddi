# Backlog de Issues — Entrega 1.2 (React + PostgreSQL / Supabase)

Este documento contém todas as issues planejadas para a **Entrega 1.2 (Projeto 1.2)** do sistema **Peddi**, formatadas rigorosamente no padrão do projeto (`.github/ISSUE_TEMPLATE/user-story.md`), associadas aos **5 Critérios Oficiais de Avaliação (2,0 pts cada)** da disciplina de Programação para Web 2 (PW2).

---

## 🗂️ Mapeamento com os Critérios Avaliativos (Total: 10,0 pts)

| Código | Título | Perfil | Critério Avaliativo | Labels |
| :--- | :--- | :--- | :--- | :--- |
| **RF-GEN-01** | Modelagem Relacional, Histórico de Pedidos e Migrações PostgreSQL | `geral` | **Critério 2** (2,0 pts) | `geral,1.2,banco-de-dados` |
| **RF-GEN-02** | Autenticação e Perfis com Supabase Auth (`profiles`) | `geral` | **Critério 3** (2,0 pts) | `geral,1.2,autenticacao` |
| **RF-GEN-03** | Políticas de Isolamento com Row Level Security (RLS) | `geral` | **Critério 2** (2,0 pts) | `geral,1.2,seguranca` |
| **RF-GEN-04** | Proteção de Rotas e Redirecionamento por Perfil (Next.js Middleware) | `geral` | **Critério 1** (2,0 pts) | `geral,1.2,arquitetura` |
| **RF-EMP-12** | CRUD de Categorias e Produtos no PostgreSQL | `empresa` | **Critério 4** (2,0 pts) | `empresa,1.2,feature` |
| **RF-EMP-13** | Upload de Fotos de Produtos e Logomarca no Supabase Storage | `empresa` | **Critério 4** (2,0 pts) | `empresa,1.2,feature` |
| **RF-EMP-14** | Gestão de Pedidos, Avanço de Status e Timeline em Tempo Real | `empresa` | **Critério 5** (2,0 pts) | `empresa,1.2,feature` |
| **RF-EMP-15** | Gestão e Vínculo de Entregadores com Código de Conexão | `empresa` | **Critério 3** (2,0 pts) | `empresa,1.2,feature` |
| **RF-CLI-06** | Cardápio Reativo e Estado do Carrinho Persistido no Cliente (Zustand) | `cliente` | **Critério 4** (2,0 pts) | `cliente,1.2,feature` |
| **RF-CLI-07** | Checkout com Validação Zod, ViaCEP e Criação Transacional do Pedido | `cliente` | **Critério 4** (2,0 pts) | `cliente,1.2,feature` |
| **RF-CLI-08** | Meus Pedidos e Acompanhamento com Código de Confirmação | `cliente` | **Critério 5** (2,0 pts) | `cliente,1.2,feature` |
| **RF-ENT-11** | Reserva Atômica de até 3 Pedidos e Início de Viagem via RPC | `entregador` | **Critério 5** (2,0 pts) | `entregador,1.2,backend` |
| **RF-ENT-12** | Painel da Viagem Ativa e Desbloqueio dos Dados de Rota | `entregador` | **Critério 5** (2,0 pts) | `entregador,1.2,feature` |
| **RF-ENT-13** | Validação Atômica do Código, Bloqueio por Tentativas e Registro de Falha | `entregador` | **Critério 5** (2,0 pts) | `entregador,1.2,backend` |
| **RNF-01** | Padronização Visual, Feedback com Toasts e Validações de Formulário | `geral` | **Critério 1** (2,0 pts) | `geral,1.2,rnf,ui/ux` |
| **RNF-02** | Deploy em Produção (Vercel + Supabase Cloud) e Smoke Test Integrado | `geral` | **Critério 1 e 5** (2,0 pts) | `geral,1.2,rnf,devops` |

---

## 📌 Issues Detalhadas

### Issue 1: [RF-GEN-01] Modelagem Relacional, Histórico de Pedidos e Migrações PostgreSQL
- **Labels:** `geral,1.2,banco-de-dados`
- **Corpo:**

```markdown
> **Critério Avaliativo:** Critério 2 (2,0 pts) — Banco de Dados Relacional & Modelagem PostgreSQL

**Como** desenvolvedor do sistema, **quero** criar as migrações estruturadas do banco de dados relacional no Supabase com rastreamento histórico e integridade referencial, **para** garantir persistência ACID para empresas, cardápios, pedidos, viagens e auditoria de movimentações.

## Critérios de aceitação
- [ ] Criar a migração `0001_schema.sql` contendo as tabelas: `establishments`, `profiles`, `categories`, `products`, `orders`, `order_items`, `order_history` e `deliveries`.
- [ ] Modelar a tabela `order_history` (`id`, `order_id`, `from_status`, `to_status`, `changed_at`, `changed_by`) para registrar cada transição de estado e alimentar a timeline e o painel de atividades recentes.
- [ ] Garantir que `order_items` preserve o preço unitário (`unit_price`) praticado no momento da compra e que `orders` registre a `delivery_fee` fixa daquele pedido, impedindo alterações retroativas se o cardápio mudar.
- [ ] Definir chaves primárias baseadas em `UUID` (`gen_random_uuid()`) e integridade referencial com chaves estrangeiras.
- [ ] Criar tipos enumerados (`user_role`, `order_status`, `delivery_status`).
- [ ] Criar índices para chaves estrangeiras e campos consultados com frequência (`establishment_id`, `client_id`, `delivery_id`, `status`).
- [ ] Criar arquivo `seed.sql` com dados iniciais realistas para permitir demonstração imediata na apresentação acadêmica.
```

---

### Issue 2: [RF-GEN-02] Autenticação e Perfis com Supabase Auth (profiles)
- **Labels:** `geral,1.2,autenticacao`
- **Corpo:**

```markdown
> **Critério Avaliativo:** Critério 3 (2,0 pts) — Autenticação, Perfis & Autorização

**Como** usuário do sistema (cliente, dono de estabelecimento ou entregador), **quero** me cadastrar e realizar login com e-mail e senha, **para** que o sistema identifique com segurança o meu perfil de acesso e vincule meus dados.

## Critérios de aceitação
- [ ] Integrar o cliente `@supabase/ssr` / `@supabase/supabase-js` em `web/src/lib/supabase/`.
- [ ] Criar trigger PostgreSQL (`on_auth_user_created`) que insere automaticamente um registro na tabela `profiles` ao criar conta no `auth.users`, sincronizando nome, telefone e papel (`role`: 'cliente', 'empresa', 'entregador').
- [ ] Implementar formulário de Login (`/(auth)/login`) validado com React Hook Form e Zod com mensagens claras em caso de credenciais inválidas.
- [ ] Implementar formulário de Cadastro (`/(auth)/register`) permitindo selecionar o tipo de perfil inicial.
- [ ] Implementar função de Logout que limpa a sessão e redireciona para a página de login.
- [ ] Exibir o perfil atual e botão de logout no cabeçalho da aplicação.
```

---

### Issue 3: [RF-GEN-03] Políticas de Isolamento com Row Level Security (RLS)
- **Labels:** `geral,1.2,seguranca`
- **Corpo:**

```markdown
> **Critério Avaliativo:** Critério 2 (2,0 pts) — Segurança a Nível de Linha (RLS) no PostgreSQL

**Como** arquiteto de segurança da aplicação, **quero** configurar as políticas de Row Level Security (RLS) no PostgreSQL, **para** assegurar no próprio banco que nenhum usuário acesse ou altere dados confidenciais de outros perfis.

## Critérios de aceitação
- [ ] Ativar RLS (`ENABLE ROW LEVEL SECURITY`) em todas as tabelas públicas da aplicação no arquivo `0002_rls.sql`.
- [ ] Configurar política em `establishments`, `categories` e `products`: leitura pública e escrita restrita à empresa dona do registro (`auth.uid() = owner_id`).
- [ ] Configurar política em `profiles`: usuário só pode visualizar e atualizar seu próprio perfil.
- [ ] Configurar política em `orders`:
  - Cliente: seleciona e insere apenas pedidos vinculados ao seu próprio `client_id = auth.uid()`.
  - Empresa: seleciona e atualiza pedidos vinculados ao seu `establishment_id`.
  - Entregador: seleciona pedidos com status 'pronto' ou vinculados à sua entrega ativa (`delivery_id`).
- [ ] Configurar proteção de privacidade: mascarar endereço completo (rua, número) e telefone do cliente para o entregador enquanto o status for 'pronto'.
- [ ] Validar que tentativas de consulta via Client API fora das regras resultem em array vazio ou erro de permissão.
```

---

### Issue 4: [RF-GEN-04] Proteção de Rotas e Redirecionamento por Perfil (Next.js Middleware)
- **Labels:** `geral,1.2,arquitetura`
- **Corpo:**

```markdown
> **Critério Avaliativo:** Critério 1 (2,0 pts) — Arquitetura Next.js App Router & Middleware

**Como** usuário autenticado, **quero** ser direcionado automaticamente para o painel correspondente ao meu papel e impedido de acessar áreas não autorizadas, **para** garantir uma experiência de navegação segura e fluida.

## Critérios de aceitação
- [ ] Configurar `web/src/middleware.ts` utilizando `@supabase/ssr` para verificar o cookie de sessão e recuperar o perfil do usuário.
- [ ] Bloquear acesso a rotas administrativas `/(company)/admin/*` para usuários que não possuam papel 'empresa'.
- [ ] Bloquear acesso a rotas do entregador `/(courier)/courier/*` para usuários que não possuam papel 'entregador'.
- [ ] Bloquear acesso ao checkout `/cart` e `/orders` caso o usuário não esteja autenticado, redirecionando para login com `redirectTo`.
- [ ] Redirecionar usuário logado que acessa a rota raiz `/` diretamente para seu painel correspondente (`/menu`, `/admin/dashboard` ou `/courier/available`).
- [ ] Tratar renovação de tokens (refresh token) de forma transparente nas requisições.
```

---

### Issue 5: [RF-EMP-12] CRUD de Categorias e Produtos no PostgreSQL
- **Labels:** `empresa,1.2,feature`
- **Corpo:**

```markdown
> **Critério Avaliativo:** Critério 4 (2,0 pts) — Formulários com Zod & Mutações com TanStack Query

**Como** dono do estabelecimento, **quero** cadastrar, editar, desativar e excluir produtos e categorias, **para** manter o cardápio do meu negócio atualizado para os clientes.

## Critérios de aceitação
- [ ] Criar tela de gestão de cardápio em `/(company)/admin/products`.
- [ ] Listagem de produtos agrupados por categoria com badge indicando disponibilidade (ativo/inativo).
- [ ] Formulário modal/drawer para adicionar e editar produto, validado com React Hook Form + Zod (nome obrigatório, preço numérico positivo em centavos, categoria selecionável).
- [ ] Opção de alternar disponibilidade de um item com mutação e invalidação de cache via TanStack Query.
- [ ] Opção de criar nova categoria personalizada para o estabelecimento.
- [ ] Mensagens de sucesso ou erro amigáveis via Toast.
```

---

### Issue 6: [RF-EMP-13] Upload de Fotos de Produtos e Logomarca no Supabase Storage
- **Labels:** `empresa,1.2,feature`
- **Corpo:**

```markdown
> **Critério Avaliativo:** Critério 4 (2,0 pts) — Gerenciamento de Arquivos no Supabase Storage

**Como** dono do estabelecimento, **quero** fazer upload das imagens dos produtos e da logo da minha loja, **para** personalizar a identidade visual e tornar o cardápio mais atraente.

## Critérios de aceitação
- [ ] Criar buckets públicos no Supabase Storage: `products` e `logos`.
- [ ] Definir políticas de storage permitindo leitura pública e upload/deleção apenas para usuários com perfil 'empresa'.
- [ ] Componente de upload no formulário de produtos com prévia da imagem selecionada.
- [ ] Validação do arquivo: formatos aceitos (JPEG, PNG, WebP) e tamanho máximo (até 2MB).
- [ ] Gravação da URL pública gerada no campo `image_url` da tabela `products` ou `logo_url` da tabela `establishments`.
- [ ] Fallback elegante (ícone ou placeholder) para itens sem imagem cadastrada.
```

---

### Issue 7: [RF-EMP-14] Gestão de Pedidos, Avanço de Status e Timeline em Tempo Real
- **Labels:** `empresa,1.2,feature`
- **Corpo:**

```markdown
> **Critério Avaliativo:** Critério 5 (2,0 pts) — Regras de Negócio, Kanban & Sincronização

**Como** atendente ou cozinheiro do estabelecimento, **quero** visualizar os pedidos em um quadro de status e avançá-los até 'Pronto', **para** coordenar o preparo e liberar para entrega de maneira organizada.

## Critérios de aceitação
- [ ] Criar página `/(company)/admin/orders` com colunas/abas por status: Recebido, Em Preparo, Pronto e Em Entrega/Finalizados.
- [ ] Cada card de pedido deve exibir: número do pedido, horário, cliente, bairro, itens, valor total e observações.
- [ ] Ações rápidas para avançar de status: `Recebido -> Em Preparo -> Pronto`.
- [ ] A cada mudança de status, inserir registro correspondente na tabela `order_history` para auditoria e histórico de atividades recentes.
- [ ] Opção de cancelamento justificado para pedidos antes de saírem para entrega.
- [ ] Atualização dos pedidos na tela sem recarregamento (polling configurado no TanStack Query com `refetchInterval: 5000` ou Supabase Realtime).
- [ ] Exibição visual de motivo de falha caso um pedido tenha sido marcado como 'Não concluído' pelo entregador.
```

---

### Issue 8: [RF-EMP-15] Gestão e Vínculo de Entregadores com Código de Conexão
- **Labels:** `empresa,1.2,feature`
- **Corpo:**

```markdown
> **Critério Avaliativo:** Critério 3 (2,0 pts) — Autorização & Vínculo Multi-usuário

**Como** gestor do estabelecimento, **quero** cadastrar entregadores autorizados e gerar um código de conexão seguro, **para** que apenas profissionais de confiança possam vincular sua conta à minha empresa e retirar pedidos.

## Critérios de aceitação
- [ ] Criar página de entregadores em `/(company)/admin/couriers`.
- [ ] Listagem dos entregadores cadastrados com status (ativo/inativo) e histórico de entregas realizadas.
- [ ] Formulário para pré-cadastrar entregador (nome e telefone de contato).
- [ ] Botão para gerar/renovar código de conexão de 8 caracteres alfanuméricos persistido na tabela `establishments`.
- [ ] Botão para copiar código de conexão com feedback visual via Toast.
- [ ] Alerta informativo indicando que renovar o código invalida conexões ativas ainda não confirmadas.
```

---

### Issue 9: [RF-CLI-06] Cardápio Reativo e Estado do Carrinho Persistido no Cliente (Zustand)
- **Labels:** `cliente,1.2,feature`
- **Corpo:**

```markdown
> **Critério Avaliativo:** Critério 4 (2,0 pts) — Gerenciamento de Estado Global com Zustand

**Como** cliente, **quero** navegar pelos itens do cardápio filtrando por categoria ou busca textual e adicionar itens ao carrinho com observações, **para** montar meu pedido facilmente.

## Critérios de aceitação
- [ ] Criar página de cardápio em `/(client)/menu` consumindo dados do Supabase via TanStack Query.
- [ ] Filtro rápido por categoria em abas horizontais e campo de busca instantânea filtrando produtos por nome ou descrição.
- [ ] Card de produto com imagem, nome, descrição, preço formatado e botão 'Adicionar'.
- [ ] Gerenciamento do carrinho com Zustand (`cart-store.ts`) persistido exclusivamente no cliente com middleware `persist` do Zustand (armazenado em `localStorage`, evitando tabelas temporárias no banco):
  - Adição de item com quantidade e observação opcional.
  - Incremento e decremento de quantidades com remoção automática em 0.
  - Cálculo dinâmico do subtotal, taxa de entrega da empresa e total final via funções puras.
- [ ] Indicador flutuante de itens no carrinho com acesso rápido à tela de checkout.
```

---

### Issue 10: [RF-CLI-07] Checkout com Validação Zod, ViaCEP e Criação Transacional do Pedido
- **Labels:** `cliente,1.2,feature`
- **Corpo:**

```markdown
> **Critério Avaliativo:** Critério 4 (2,0 pts) — Formulários com React Hook Form + Zod & ViaCEP

**Como** cliente, **quero** informar meu endereço de entrega com preenchimento automático pelo CEP e forma de pagamento, **para** finalizar meu pedido com segurança e rapidez.

## Critérios de aceitação
- [ ] Criar página `/(client)/cart` com resumo dos itens do carrinho e formulário de checkout.
- [ ] Validação do formulário com React Hook Form + Zod (`schemas/address.ts`):
  - CEP obrigatório no formato `99999-999`.
  - Logradouro, número e bairro obrigatórios.
  - Telefone de contato válido com máscara.
  - Forma de pagamento selecionada (Dinheiro, PIX, Cartão na entrega).
- [ ] Integração com serviço `ViaCEP`: ao digitar os 8 dígitos do CEP, preencher automaticamente logradouro, bairro, cidade e estado, focando no campo de número.
- [ ] Criação transacional do pedido: inserir registro em `orders`, os itens correspondentes em `order_items` (preservando o preço histórico) e o primeiro registro em `order_history`.
- [ ] Limpeza do carrinho no Zustand após sucesso e redirecionamento para a tela do pedido criado (`/(client)/orders/[id]`).
```

---

### Issue 11: [RF-CLI-08] Meus Pedidos e Acompanhamento com Código de Confirmação
- **Labels:** `cliente,1.2,feature`
- **Corpo:**

```markdown
> **Critério Avaliativo:** Critério 5 (2,0 pts) — Timeline de Pedido e Exibição de Código Protegido

**Como** cliente, **quero** acompanhar o progresso do meu pedido em tempo real e consultar o código de confirmação de entrega, **para** saber quando meu pedido chegará e informar o código ao entregador.

## Critérios de aceitação
- [ ] Criar página de histórico em `/(client)/orders` listando pedidos anteriores do cliente logado.
- [ ] Criar página detalhada em `/(client)/orders/[id]` com timeline visual baseada no histórico:
  - Recebido -> Em Preparo -> Pronto -> Saiu para entrega -> Entregue.
- [ ] Atualização automática do status da tela sem recarregamento (polling TanStack Query ou realtime).
- [ ] Exibir o **código de entrega de 4 dígitos** em destaque na tela **somente quando o status for 'saiu_para_entrega'**.
- [ ] Exibir aviso explicativo: *'Informe este código ao entregador apenas quando receber os seus produtos.'*
- [ ] Permitir cancelamento do pedido pelo cliente enquanto o status ainda for 'recebido' ou 'em_preparo'.
```

---

### Issue 12: [RF-ENT-11] Reserva Atômica de até 3 Pedidos e Início de Viagem via RPC
- **Labels:** `entregador,1.2,backend`
- **Corpo:**

```markdown
> **Critério Avaliativo:** Critério 5 (2,0 pts) — Concorrência no Banco & Transações PostgreSQL (RPC)

**Como** entregador, **quero** selecionar até 3 pedidos prontos e iniciar uma viagem de forma atômica no banco, **para** que nenhum outro entregador pegue os mesmos pedidos simultaneamente.

## Critérios de aceitação
- [ ] Criar tela `/(courier)/courier/available` listando apenas pedidos com status 'pronto'.
- [ ] Respeitar a regra de privacidade: na lista de disponíveis, exibir apenas número, bairro, quantidade de itens e valor total (ocultando rua, número e nome do cliente).
- [ ] Permitir marcar checkbox de até 3 pedidos (desabilitando visualmente os demais ao atingir o limite de 3).
- [ ] Criar Stored Procedure (RPC) no PostgreSQL `iniciar_viagem(p_order_ids uuid[], p_courier_id uuid)` em `0003_functions.sql`:
  - Verificar se o entregador já possui viagem em andamento (bloquear se houver).
  - Executar lock pessimista (`SELECT id FROM orders WHERE id = ANY(p_order_ids) AND status = 'pronto' AND delivery_id IS NULL FOR UPDATE`).
  - Se algum pedido já tiver sido pego por outro entregador, abortar a transação com mensagem de erro clara.
  - Criar registro na tabela `deliveries`.
  - Atualizar os pedidos para status 'saiu_para_entrega', associando `delivery_id`.
  - Gerar atômica e seguramente um código numérico aleatório de 4 dígitos para cada pedido (`lpad(floor(random()*10000)::text, 4, '0')`).
  - Inserir eventos de mudança de status em `order_history`.
- [ ] Redirecionar imediatamente o entregador para `/(courier)/courier/trip` ao confirmar a saída.
```

---

### Issue 13: [RF-ENT-12] Painel da Viagem Ativa e Desbloqueio dos Dados de Rota
- **Labels:** `entregador,1.2,feature`
- **Corpo:**

```markdown
> **Critério Avaliativo:** Critério 5 (2,0 pts) — Painel do Entregador & Integração com Mapas

**Como** entregador em viagem, **quero** visualizar a lista de paradas com endereços completos, rotas e contatos, **para** realizar as entregas de forma eficiente.

## Critérios de aceitação
- [ ] Criar página `/(courier)/courier/trip` apresentando a rota ativa da viagem.
- [ ] Com a viagem iniciada, liberar visibilidade total dos dados dos pedidos atribuídos: nome do cliente, telefone e endereço completo com número e complemento.
- [ ] Botão de ação rápida para abrir o endereço no Google Maps / Waze (`https://www.google.com/maps/search/?api=1&query=...`).
- [ ] Botão de atalho para discar para o telefone do cliente em caso de dificuldade no local.
- [ ] Indicador de progresso: paradas concluídas versus paradas restantes (ex.: '1 de 3 concluídas').
- [ ] Bloqueio de novas viagens enquanto a atual não for concluída (RF-ENT-08).
```

---

### Issue 14: [RF-ENT-13] Validação Atômica do Código, Bloqueio por Tentativas e Registro de Falha
- **Labels:** `entregador,1.2,backend`
- **Corpo:**

```markdown
> **Critério Avaliativo:** Critério 5 (2,0 pts) — Validação de Regras de Negócio via RPC

**Como** entregador no local de entrega, **quero** digitar o código de 4 dígitos informado pelo cliente para concluir a entrega, ou registrar o motivo da falha se não for possível entregar, **para** comprovar a entrega ou justificar incidentes sem travar a viagem.

## Critérios de aceitação
- [ ] Criar modal ou campo de conferência do código de 4 dígitos em cada parada da viagem.
- [ ] Criar função RPC no PostgreSQL `confirmar_entrega(p_order_id uuid, p_codigo text, p_courier_id uuid)`:
  - Verificar se o código confere com o gravado no pedido.
  - Se correto: marcar pedido como 'entregue', registrar timestamp de entrega e inserir em `order_history`.
  - Se incorreto: incrementar contador de tentativas.
  - Ao atingir 3 tentativas erradas: alterar status para 'bloqueado' e impedir novas inserções de código.
- [ ] Criar função RPC ou mutation para `registrar_falha_entrega(p_order_id uuid, p_motivo text, p_courier_id uuid)`:
  - Disponível caso o pedido esteja bloqueado ou ocorra imprevisto (cliente ausente, endereço não localizado, etc.).
  - Alterar status para 'nao_concluido' e persistir a justificativa.
- [ ] Quando todos os pedidos da viagem estiverem 'entregues', 'cancelados' ou 'nao_concluidos', marcar a viagem na tabela `deliveries` como 'finalizada', liberando o entregador para nova viagem.
```

---

### Issue 15: [RNF-01] Padronização Visual, Feedback com Toasts e Validações de Formulário
- **Labels:** `geral,1.2,rnf,ui/ux`
- **Corpo:**

```markdown
> **Critério Avaliativo:** Critério 1 (2,0 pts) — Qualidade de Interface & Componentização com Tailwind

**Como** usuário do sistema, **quero** uma interface com design limpo, responsivo, acessível e com feedback claro de operações, **para** ter uma excelente experiência de uso em celulares e computadores.

## Critérios de aceitação
- [ ] Utilizar componentes baseados em Tailwind CSS e shadcn/ui (botões, badges, modais, formulários, toasts).
- [ ] Garantir responsividade fluida para mobile (360px) e desktop (1280px+).
- [ ] Padronizar badges de status com cores semânticas (Verde = Entregue/Pronto, Laranja = Preparo/Saiu para entrega, Vermelho = Cancelado/Bloqueado).
- [ ] Feedback visual imediato com Toasts (Sonner) para todas as ações assíncronas (sucesso, aviso, erro).
- [ ] Validações de formulário com máscaras visuais para CEP (`99999-999`) e Telefone (`(99) 99999-9999`).
```

---

### Issue 16: [RNF-02] Deploy em Produção (Vercel + Supabase Cloud) e Smoke Test Integrado
- **Labels:** `geral,1.2,rnf,devops`
- **Corpo:**

```markdown
> **Critério Avaliativo:** Critério 1 e 5 (2,0 pts) — Deploy, Entrega Contínua & Apresentação

**Como** equipe do projeto interdisciplinar, **quero** publicar o sistema web funcional em produção e validar o fluxo ponta a ponta, **para** cumprir as diretrizes avaliativas de entrega e apresentação da disciplina.

## Critérios de aceitação
- [ ] Configurar projeto remoto no Supabase Cloud (PostgreSQL, Auth e Storage).
- [ ] Executar migrações `0001_schema.sql`, `0002_rls.sql`, `0003_functions.sql` e `seed.sql` em produção.
- [ ] Realizar deploy do frontend Next.js na plataforma Vercel vinculado ao repositório GitHub.
- [ ] Configurar variáveis de ambiente na Vercel: `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] Atualizar o `README.md` com o link oficial da aplicação no ar e instruções claras de execução local.
- [ ] Validar smoke test manual com o roteiro completo de apresentação para os 3 perfis.
```
