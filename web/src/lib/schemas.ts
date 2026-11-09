import { z } from "zod";

// 1. Validação de Login
export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

// 2. Validação de Cadastro
export const cadastroSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Informe um e-mail válido"),
  telefone: z.string().min(10, "Informe um telefone válido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  role: z.enum(["cliente", "empresa", "entregador"], {
    errorMap: () => ({ message: "Selecione um perfil de acesso" }),
  }),
});

// 3. Validação do Checkout (com ViaCEP)
export const checkoutSchema = z.object({
  nome: z.string().min(3, "Informe seu nome completo"),
  telefone: z.string().min(10, "Telefone inválido"),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, "CEP inválido (ex: 58000-000)"),
  logradouro: z.string().min(3, "Rua/Avenida obrigatória"),
  numero: z.string().min(1, "Número obrigatório"),
  bairro: z.string().min(2, "Bairro obrigatório"),
  cidade: z.string().min(2, "Cidade obrigatória"),
  complemento: z.string().optional(),
  formaPagamento: z.enum(["dinheiro", "pix", "cartao"], {
    errorMap: () => ({ message: "Selecione uma forma de pagamento" }),
  }),
});

// 4. Validação de Produto (CRUD da empresa)
export const produtoSchema = z.object({
  nome: z.string().min(2, "Nome do produto é obrigatório"),
  descricao: z.string().optional(),
  preco: z.coerce.number().positive("O preço deve ser maior que zero"),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  disponivel: z.boolean().default(true),
});

// 5. Validação do Código de Entrega (4 dígitos)
export const codigoEntregaSchema = z.object({
  codigo: z.string().regex(/^\d{4}$/, "O código deve conter exatamente 4 dígitos"),
});
