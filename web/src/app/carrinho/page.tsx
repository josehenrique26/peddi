"use client";

import { useCarrinho } from "@/lib/cart-store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkoutSchema } from "@/lib/schemas";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

type CheckoutFormData = z.infer<typeof checkoutSchema>;

// Rota: /carrinho — Resumo do pedido + formulário com validação Zod e ViaCEP
export default function CarrinhoPage() {
  const router = useRouter();
  const { itens, subtotal, atualizarQuantidade, removerItem, limparCarrinho } = useCarrinho();
  const [carregando, setCarregando] = useState(false);

  const taxaEntrega = 500; // R$ 5,00 fixa de exemplo (em centavos)
  const total = subtotal() + (itens.length > 0 ? taxaEntrega : 0);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      formaPagamento: "pix",
    },
  });

  // Busca o endereço na API do ViaCEP quando o cliente digita 8 dígitos
  async function buscarCep(cepDigitado: string) {
    const cepLimpo = cepDigitado.replace(/\D/g, "");
    if (cepLimpo.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const dados = await res.json();
        if (!dados.erro) {
          setValue("logradouro", dados.logradouro);
          setValue("bairro", dados.bairro);
          setValue("cidade", dados.localidade);
        }
      } catch (e) {
        console.error("Erro ao consultar ViaCEP:", e);
      }
    }
  }

  // Finaliza o pedido e grava no Supabase (orders + order_items)
  async function onSubmit(data: CheckoutFormData) {
    if (itens.length === 0) return alert("Seu carrinho está vazio!");

    try {
      setCarregando(true);

      // 1. Cria o pedido na tabela orders
      const { data: pedido, error: erroPedido } = await supabase
        .from("orders")
        .insert({
          nome_cliente: data.nome,
          telefone: data.telefone,
          cep: data.cep,
          endereco: `${data.logradouro}, ${data.numero}`,
          bairro: data.bairro,
          cidade: data.cidade,
          forma_pagamento: data.formaPagamento,
          taxa_entrega: taxaEntrega,
          total: total,
          status: "recebido",
        })
        .select()
        .single();

      if (erroPedido) throw erroPedido;

      // 2. Cria os itens do pedido em order_items
      const itensDoPedido = itens.map((item) => ({
        order_id: pedido.id,
        product_id: item.id,
        quantidade: item.quantidade,
        preco_unitario: item.preco,
      }));

      await supabase.from("order_items").insert(itensDoPedido);

      limparCarrinho();
      router.push(`/pedidos/${pedido.id}`);
    } catch (err: any) {
      alert("Erro ao finalizar pedido: " + err.message);
    } finally {
      setCarregando(false);
    }
  }

  if (itens.length === 0) {
    return (
      <div className="py-16 text-center space-y-4">
        <span className="text-5xl block">🛒</span>
        <h2 className="text-2xl font-bold text-gray-800">Seu carrinho está vazio</h2>
        <p className="text-gray-500">Volte ao cardápio para adicionar delícias ao seu pedido!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* 1. Resumo dos itens do carrinho */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Seu Pedido</h2>

        <div className="divide-y divide-gray-100">
          {itens.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">{item.nome}</h4>
                <p className="text-xs text-gray-500">
                  {((item.preco * item.quantidade) / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => atualizarQuantidade(item.id, item.quantidade - 1)}
                  className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center font-bold text-gray-700 hover:bg-gray-100"
                >
                  -
                </button>
                <span className="text-sm font-bold w-5 text-center">{item.quantidade}</span>
                <button
                  type="button"
                  onClick={() => atualizarQuantidade(item.id, item.quantidade + 1)}
                  className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center font-bold text-gray-700 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-200 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>
              {(subtotal() / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Taxa de entrega</span>
            <span>
              {(taxaEntrega / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
          <div className="flex justify-between text-lg font-black text-gray-900 pt-2 border-t border-gray-100">
            <span>Total</span>
            <span className="text-orange-600">
              {(total / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Formulário com React Hook Form + Zod + ViaCEP */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4"
      >
        <h2 className="text-xl font-bold text-gray-900">Endereço de Entrega</h2>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Seu Nome</label>
          <input
            {...register("nome")}
            placeholder="Ex: Maria Silva"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-orange-500 focus:outline-none"
          />
          {errors.nome && <p className="text-xs text-red-600 mt-1">{errors.nome.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Telefone</label>
            <input
              {...register("telefone")}
              placeholder="(83) 99999-9999"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-orange-500 focus:outline-none"
            />
            {errors.telefone && <p className="text-xs text-red-600 mt-1">{errors.telefone.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">CEP</label>
            <input
              {...register("cep")}
              placeholder="58000-000"
              onChange={(e) => {
                register("cep").onChange(e);
                buscarCep(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-orange-500 focus:outline-none"
            />
            {errors.cep && <p className="text-xs text-red-600 mt-1">{errors.cep.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Rua</label>
            <input
              {...register("logradouro")}
              placeholder="Rua / Avenida"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Número</label>
            <input
              {...register("numero")}
              placeholder="Nº"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Bairro</label>
            <input
              {...register("bairro")}
              placeholder="Bairro"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cidade</label>
            <input
              {...register("cidade")}
              placeholder="Cidade"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Forma de Pagamento</label>
          <select
            {...register("formaPagamento")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-orange-500 focus:outline-none bg-white"
          >
            <option value="pix">PIX</option>
            <option value="cartao">Cartão de Crédito / Débito na entrega</option>
            <option value="dinheiro">Dinheiro na entrega</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={carregando}
          className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-base shadow transition disabled:opacity-50"
        >
          {carregando ? "Enviando pedido..." : "Confirmar e Fazer Pedido"}
        </button>
      </form>
    </div>
  );
}
