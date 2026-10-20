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

## Limites

O escopo atual usa sessão de demonstração e LocalStorage. A verificação da empresa mantém os dados consistentes na aplicação, mas não é autorização segura contra alteração local do navegador; o código de conexão não é uma credencial segura para produção, que exige autenticação e validação no servidor.
