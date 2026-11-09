import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ItemCarrinho {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  observacao?: string;
  imagemUrl?: string;
}

interface CarrinhoState {
  itens: ItemCarrinho[];
  adicionarItem: (item: Omit<ItemCarrinho, "quantidade">) => void;
  removerItem: (id: string) => void;
  atualizarQuantidade: (id: string, quantidade: number) => void;
  limparCarrinho: () => void;
  totalItens: () => number;
  subtotal: () => number;
}

// Gerenciamento global do carrinho no navegador via Zustand
export const useCarrinho = create<CarrinhoState>()(
  persist(
    (set, get) => ({
      itens: [],

      adicionarItem: (novoItem) =>
        set((state) => {
          const existente = state.itens.find((i) => i.id === novoItem.id);
          if (existente) {
            return {
              itens: state.itens.map((i) =>
                i.id === novoItem.id
                  ? { ...i, quantidade: i.quantidade + 1 }
                  : i
              ),
            };
          }
          return { itens: [...state.itens, { ...novoItem, quantidade: 1 }] };
        }),

      removerItem: (id) =>
        set((state) => ({
          itens: state.itens.filter((i) => i.id !== id),
        })),

      atualizarQuantidade: (id, quantidade) =>
        set((state) => ({
          itens:
            quantidade <= 0
              ? state.itens.filter((i) => i.id !== id)
              : state.itens.map((i) =>
                  i.id === id ? { ...i, quantidade } : i
                ),
        })),

      limparCarrinho: () => set({ itens: [] }),

      totalItens: () =>
        get().itens.reduce((acc, item) => acc + item.quantidade, 0),

      subtotal: () =>
        get().itens.reduce((acc, item) => acc + item.preco * item.quantidade, 0),
    }),
    {
      name: "peddi-carrinho", // chave salva no localStorage do navegador
    }
  )
);
