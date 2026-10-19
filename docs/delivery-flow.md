# Fluxo de Entrega — Perfil Entregador

Este documento descreve as regras de negócio, ciclo de vida e transições de estado dos pedidos e viagens no perfil do **Entregador** (Projeto 1.1 e 1.2).

---

## 1. Regras Gerais da Viagem
- **Limite de pedidos por viagem:** O entregador pode selecionar no máximo **3 pedidos** com status `"Pronto"` por viagem (RF-ENT-02).
- **Reserva atômica:** Ao iniciar a viagem, os pedidos são reservados exclusivamente para o entregador ativo, impedindo que outro entregador pegue os mesmos pedidos simultaneamente (RF-ENT-03).
- **Bloqueio de viagem simultânea:** Enquanto houver uma viagem ativa em andamento, o botão "Iniciar viagem" fica bloqueado com aviso visual e sonoro/toast. O entregador só pode iniciar uma nova viagem após concluir ou encerrar a atual (RF-ENT-08).

---

## 2. Estados do Pedido na Entrega

| Estado | Descrição | Visibilidade de Dados |
| :--- | :--- | :--- |
| `Pronto` | Pedido liberado pela cozinha/estabelecimento para retirada. | **Privacidade ativa:** O entregador vê número, bairro, itens e valor. Nome do cliente e rua/número ficam ocultos (RF-ENT-01). |
| `Saiu para entrega` | Viagem iniciada pelo entregador. É gerado o código de 4 dígitos. | **Dados completos liberados:** Nome, telefone e endereço completo visíveis para rota e navegação via mapa (RF-ENT-04). |
| `Entregue` | Entrega confirmada com sucesso mediante validação correta do código de 4 dígitos na ordem das paradas (RF-ENT-05, RF-ENT-06). | Parada concluída com sucesso. Data/hora de entrega registradas. |
| `Bloqueado` | Ocorreram 3 tentativas incorretas seguidas do código de confirmação (RF-ENT-07). | Validação por código travada por segurança. Exibe dados de contato com o estabelecimento e opção de registrar falha (RF-ENT-09). |
| `Não concluído` | A entrega não pôde ser realizada e o entregador registrou o motivo da falha (RF-ENT-09). | Parada finalizada com registro da justificativa. Motivo salvo no pedido e visível para o estabelecimento. |
| `Cancelado` | Pedido cancelado pelo estabelecimento ou cliente antes da conclusão. | Parada finalizada com justificativa. |

---

## 3. Registro de Falha na Entrega (RF-ENT-09)

Quando uma entrega não puder ser completada, o entregador tem uma saída oficial para não travar a rota nem a viagem:

1. **Disponibilidade:**
   - Disponível em qualquer parada com status `"Saiu para entrega"`.
   - Disponível obrigatoriamente quando o limite de 3 tentativas do código (RF-ENT-07) se esgota (`Bloqueado`).
2. **Motivos estruturados:**
   - **Cliente ausente:** Ninguém atendeu no endereço após tentativas de contato.
   - **Endereço não encontrado:** Rua, número ou localidade inacessível/inexistente.
   - **Código perdido / cliente sem código:** Cliente sem celular ou impossibilitado de informar os 4 dígitos.
   - **Outro motivo:** Descrição livre preenchida pelo entregador.
3. **Efeito na Viagem:**
   - O pedido deixa de contar como pendente.
   - A rota avança automaticamente para a próxima parada da sequência.
   - A viagem é concluída quando todos os pedidos estiverem **Entregues**, **Cancelados** ou **Não concluídos**.
4. **Visibilidade para a Empresa:**
   - O motivo e o registro da falha ficam salvos no pedido (`pedido.reason` / `pedido.motivo_falha`) e são exibidos no painel Kanban da empresa (`admin-pedidos.html`).
