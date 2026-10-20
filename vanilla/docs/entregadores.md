# Cadastro de entregadores

## Dados e regras

Os entregadores continuam na coleção `couriers` com as propriedades já existentes: `id`, `companyId`, `name`, `phone`, `code` e `active`. O cadastro requer nome e telefone válidos, não permite repetir o telefone na mesma empresa e não altera os registros iniciais. A lista administrativa é filtrada pela empresa selecionada na sessão.

Os novos códigos automáticos do entregador têm oito caracteres. Ao ler dados antigos, o armazenamento normaliza apenas o padrão automático antigo `E-####7`, sem alterar IDs, vínculos, pedidos, viagens ou histórico; `DATA_VERSION` não muda.

## Persistência

O serviço atualiza a coleção e a sequência de IDs no LocalStorage central. Se a gravação falhar, desfaz a mutação e restaura a sequência para que a interface não informe sucesso falso. A inativação mantém o registro para preservar o histórico e é recusada enquanto o entregador tiver uma viagem em andamento.

## Código de conexão da empresa (RF-EMP-11)

O `code` existente da empresa é comercial: é editável nas configurações e usado por clientes para localizar a loja. O código de conexão é um campo separado, opcional, chamado `connectionCode`, gravado no registro da empresa somente quando solicitado. Assim, dados antigos continuam válidos e não precisam de alteração em `DATA_VERSION`.

O serviço gera `connectionCode` com oito caracteres alfanuméricos maiúsculos usando `crypto.getRandomValues`. A geração só pode ser solicitada pela sessão administrativa da própria empresa. O valor candidato é comparado com os códigos comerciais e códigos de conexão já válidos de todas as empresas; em colisão, uma nova tentativa é feita, com limite de 20 tentativas e erro explícito se não houver código exclusivo. Uma renovação substitui o código da própria empresa e, portanto, invalida o código anterior.

O requisito não especifica uso único nem validade temporal. Por isso, o serviço não consome o código ao gerar, não aplica expiração e não define esse comportamento nesta etapa. A falha de persistência restaura o valor anterior, inclusive removendo a propriedade se ainda não existia.

## Confirmação do entregador (RF-ENT-10)

Antes de consultar pedidos prontos ou assumir uma viagem, o entregador informa o telefone cadastrado e o código de conexão de oito caracteres da empresa. O telefone localiza o cadastro dentro da empresa identificada pelo código; o código comercial usado pelos clientes não é aceito. Telefone ou código incorretos não liberam o acesso, e cadastros inativos não podem confirmar identidade.

A confirmação fica associada à sessão do entregador e à versão atual do código de conexão. Renovar o código invalida confirmações anteriores. A criação da viagem repete a validação, para impedir que a interface seja contornada. Como o projeto usa sessão de demonstração e LocalStorage, isso mantém o fluxo consistente na aplicação, mas não substitui autenticação e validação no servidor.

## Limites

O escopo atual usa sessão de demonstração e LocalStorage. A verificação da empresa mantém os dados consistentes na aplicação, mas não é autorização segura contra alteração local do navegador; o código de conexão não é uma credencial segura para produção, que exige autenticação e validação no servidor.

## Fluxo completo e validação

O código comercial (`companies[].code`) continua sendo usado pelos clientes para localizar lojas. A empresa gera separadamente `companies[].connectionCode`; o valor não é preenchido automaticamente nos dados iniciais. O entregador informa esse código e o telefone cadastrado. O serviço encontra a empresa pelo código, procura o telefone dentro daquela empresa e associa à sessão somente um cadastro ativo. O formulário não libera pedidos por si só: a confirmação é gravada na sessão, a tela só mostra os pedidos depois dela e `criarViagem` repete a validação no serviço. Renovar o código invalida confirmações que guardavam o código anterior.

Os novos dados não exigem migração: `connectionCode` é opcional no registro da empresa e a confirmação é adicionada à sessão sem alterar `DATA_VERSION`, pedidos, viagens ou entregas. Ao recarregar, o armazenamento lê novamente os dados persistidos; testes cobrem essa recuperação e a preservação do histórico.

### Principais funções e arquivos

- `src/services/couriers.js`: cadastra e lista entregadores, altera o estado ativo e gera/renova o código de conexão da empresa.
- `src/services/courier-orders.js`: `confirmarIdentidadeEntregador` valida o telefone e o código; `identidadeEntregadorConfirmada` verifica a sessão e o código vigente; `criarViagem` impede assumir pedidos sem confirmação.
- `src/pages/admin-couriers.js` e `admin-entregadores.html`: formulário administrativo, listagem e controles de geração, cópia e renovação do código.
- `src/pages/courier-available.js` e `src/components/courier-shell.js`: confirmação no perfil do entregador e apresentação condicionada dos pedidos e do vínculo.
- `tests/couriers.test.js`: regras de cadastro, código, confirmação, persistência, preservação de dados e fluxo integrado.

Os comentários didáticos usam `[RF-EMP-10]`, `[RF-EMP-11]`, `[RF-ENT-10]`, `[VALIDAÇÃO]`, `[PERSISTÊNCIA]` e `[INTEGRAÇÃO]` para relacionar as regras ao requisito e ao módulo responsável.

### Testes e build

Executados na pasta `vanilla`:

- `npm test` — aprovado: 16 testes, 0 falhas.
- `npm run build` — aprovado.
- `git diff --check` — aprovado.

O smoke test manual confirmou que a tela começa sem listar pedidos, apresenta formulário de telefone/código e, após uma confirmação válida, libera a lista. A renovação também foi exercitada na tela administrativa.

### Histórico de commits

- `ecaf49e` — cadastro e gerenciamento de entregadores (RF-EMP-10).
- `8ac3d4c` — geração do código de confirmação (RF-EMP-11).
- `e0802fa` — integração administrativa do código (RF-EMP-11).
- `3c78f6d` — confirmação do entregador e bloqueio antes de assumir pedidos (RF-ENT-10).
- `01dde90` — teste integrado de associação e persistência.

`ecaf49e` também incluiu partes de listagem, navegação e testes junto ao cadastro; `8ac3d4c` e `e0802fa` reuniram implementação e testes de cada etapa do RF-EMP-11. O commit `3c78f6d` agrupou implementação e testes de várias Tasks do RF-ENT-10, pois a lista detalhada não estava disponível quando a alteração foi feita. Esses recortes não seguiram integralmente a regra original de um commit por Task. O histórico foi mantido, sem reescrita.

### Roteiro para apresentação

1. Na área administrativa, cadastrar ou consultar um entregador e gerar o código de conexão da empresa.
2. Explicar que o código comercial da loja é diferente do código de conexão e não pode ser usado para vincular entregadores.
3. Abrir o perfil do entregador: sem confirmação, os pedidos prontos não aparecem.
4. Informar o telefone cadastrado e o código de conexão. Com ambos válidos, a sessão passa a identificar o entregador da empresa correta e a lista de pedidos é liberada.
5. Explicar as proteções: código com oito caracteres, detecção de colisões, validação no serviço, restrição a cadastro ativo e bloqueio da viagem sem confirmação.
6. Executar `npm test` e `npm run build` para demonstrar a validação automatizada.

Para produção, substituir sessão/LocalStorage por autenticação e validação no servidor; os controles atuais servem à demonstração e não protegem contra adulteração local.
