# Cadastro de entregadores

## Dados e regras

Os entregadores continuam na coleção `couriers` com as propriedades já existentes: `id`, `companyId`, `name`, `phone`, `code` e `active`. O cadastro requer nome e telefone válidos, não permite repetir o telefone na mesma empresa e não altera os registros iniciais. A lista administrativa é filtrada pela empresa selecionada na sessão.

Os novos códigos automáticos do entregador têm oito caracteres. Ao ler dados antigos, o armazenamento normaliza apenas o padrão automático antigo `E-####7`, sem alterar IDs, vínculos, pedidos, viagens ou histórico; `DATA_VERSION` não muda.

## Persistência

O serviço atualiza a coleção e a sequência de IDs no LocalStorage central. Se a gravação falhar, desfaz a mutação e restaura a sequência para que a interface não informe sucesso falso. A inativação mantém o registro para preservar o histórico e é recusada enquanto o entregador tiver uma viagem em andamento.

## Limites

O escopo atual usa sessão de demonstração e LocalStorage. A verificação da empresa mantém os dados consistentes na aplicação, mas não é autorização segura contra alteração local do navegador; produção exige autenticação e validação no servidor.
