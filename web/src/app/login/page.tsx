"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/schemas";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

type LoginFormData = z.infer<typeof loginSchema>;

// Rota: /login — Autenticação com Supabase Auth
export default function LoginPage() {
  const router = useRouter();
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    try {
      setCarregando(true);
      setErro("");

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      // Redireciona para a página principal após login
      router.push("/");
    } catch (err: any) {
      setErro(err.message || "Erro ao realizar login. Verifique suas credenciais.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <span className="text-4xl block">🔑</span>
          <h1 className="text-2xl font-black text-gray-900">Entrar no Peddi</h1>
          <p className="text-sm text-gray-500">Informe suas credenciais de acesso</p>
        </div>

        {erro && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium">{erro}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              placeholder="••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-orange-500 focus:outline-none"
            />
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm transition disabled:opacity-50"
          >
            {carregando ? "Entrando..." : "Acessar Conta"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="text-orange-600 font-bold hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
