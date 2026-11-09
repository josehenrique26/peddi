"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cadastroSchema } from "@/lib/schemas";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

type CadastroFormData = z.infer<typeof cadastroSchema>;

// Rota: /cadastro — Registro de novo usuário com perfil (cliente, empresa ou entregador)
export default function CadastroPage() {
  const router = useRouter();
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CadastroFormData>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      role: "cliente",
    },
  });

  async function onSubmit(data: CadastroFormData) {
    try {
      setCarregando(true);
      setErro("");

      // 1. Cria a conta no Supabase Auth com metadados do perfil
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            nome: data.nome,
            telefone: data.telefone,
            role: data.role,
          },
        },
      });

      if (error) throw error;

      alert("Conta criada com sucesso!");
      router.push("/login");
    } catch (err: any) {
      setErro(err.message || "Erro ao criar conta.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <span className="text-4xl block">📝</span>
          <h1 className="text-2xl font-black text-gray-900">Criar Conta</h1>
          <p className="text-sm text-gray-500">Cadastre-se para começar a usar o Peddi</p>
        </div>

        {erro && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium">{erro}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome Completo</label>
            <input
              {...register("nome")}
              placeholder="Ex: João Silva"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-orange-500 focus:outline-none"
            />
            {errors.nome && <p className="text-xs text-red-600 mt-1">{errors.nome.message}</p>}
          </div>

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
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">E-mail</label>
            <input
              type="email"
              {...register("email")}
              placeholder="seu@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-orange-500 focus:outline-none"
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Senha</label>
            <input
              type="password"
              {...register("password")}
              placeholder="Mínimo 6 dígitos"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-orange-500 focus:outline-none"
            />
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Perfil de Acesso</label>
            <select
              {...register("role")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:border-orange-500 focus:outline-none"
            >
              <option value="cliente">Cliente (Fazer pedidos)</option>
              <option value="empresa">Estabelecimento (Gerenciar pedidos e cardápio)</option>
              <option value="entregador">Entregador (Realizar entregas)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm transition disabled:opacity-50"
          >
            {carregando ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500">
          Já tem conta?{" "}
          <Link href="/login" className="text-orange-600 font-bold hover:underline">
            Faça Login
          </Link>
        </p>
      </div>
    </div>
  );
}
