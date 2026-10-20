// Regras de cadastro e gerenciamento de entregadores do estabelecimento.
import { obterDados, salvarDados, lerSessao } from "./storage.js";
import { obterEmpresa } from "./companies.js";
import { apenasDigitos, formatarTelefone, normalizarCodigo, validarEntregador } from "../utils/validate.js";

const falha = (erro) => ({ ok: false, erro });
const VIAGEM_ATIVA = ["aguardando_retirada", "em_andamento"];
const ALFABETO_CODIGO_CONEXAO = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const TAMANHO_CODIGO_CONEXAO = 8;
const MAX_TENTATIVAS_CODIGO = 20;

// [VALIDAÇÃO] A página também protege o acesso, mas o serviço repete a checagem
// para impedir operações fora da empresa selecionada na sessão administrativa.
function empresaAdministrada(empresaId) {
  const sessao = lerSessao();
  if (sessao.role !== "admin") return { erro: "Acesso restrito ao perfil do estabelecimento." };
  if (!empresaId || sessao.companyId !== empresaId) return { erro: "O estabelecimento da sessão não corresponde a esta operação." };
  if (!obterEmpresa(empresaId)) return { erro: "Estabelecimento não encontrado." };
  return {};
}

function gravarComRollback(dados, aplicar, desfazer) {
  aplicar();
  // [PERSISTÊNCIA] Uma operação só é confirmada quando LocalStorage grava.
  // Se falhar, restauramos memória e sequência para evitar um sucesso parcial.
  if (salvarDados()) return { ok: true };
  desfazer();
  return falha("Não foi possível gravar no armazenamento deste navegador.");
}

// [RF-EMP-10] A lista limita os resultados à empresa da sessão e não expõe
// registros de outras empresas na tela administrativa.
export function listarEntregadoresEmpresa(empresaId) {
  const acesso = empresaAdministrada(empresaId);
  if (acesso.erro) return falha(acesso.erro);
  const couriers = obterDados().couriers;
  if (!Array.isArray(couriers)) return falha("A coleção de entregadores está indisponível.");
  return { ok: true, entregadores: couriers.filter((courier) => courier.companyId === empresaId) };
}

// [RF-EMP-10] O serviço valida e normaliza os dados, previne duplicidade de
// telefone dentro da empresa e preserva os cadastros iniciais ao gerar novos IDs.
export function cadastrarEntregador(empresaId, campos) {
  const acesso = empresaAdministrada(empresaId);
  if (acesso.erro) return falha(acesso.erro);
  const erros = validarEntregador(campos ?? {});
  if (Object.keys(erros).length) return falha(Object.values(erros)[0]);

  const dados = obterDados();
  const couriers = Array.isArray(dados.couriers) ? dados.couriers : [];
  const nome = String(campos.name).trim();
  const telefone = formatarTelefone(campos.phone);
  const telefoneDigitos = apenasDigitos(telefone);
  if (couriers.some((courier) =>
    courier.companyId === empresaId && apenasDigitos(courier.phone) === telefoneDigitos)) {
    return falha("Já existe um entregador desta empresa com esse telefone.");
  }

  const seqAnterior = dados.seq.courier;
  let id, code;
  do {
    id = `ct_${dados.seq.courier++}`;
    const numero = id.slice(3);
    if (numero.length > 5) {
      dados.seq.courier = seqAnterior;
      return falha("Não há mais códigos de entregador de 8 caracteres disponíveis.");
    }
    code = `E-${numero.padStart(5, "0")}7`;
  } while (couriers.some((courier) => courier.id === id || courier.code === code));

  const entregador = { id, companyId: empresaId, name: nome, phone: telefone, code, active: true };
  const resultado = gravarComRollback(
    dados,
    () => couriers.push(entregador),
    () => { couriers.pop(); dados.seq.courier = seqAnterior; },
  );
  return resultado.ok ? { ...resultado, id } : resultado;
}

// [RF-EMP-10] A inativação mantém o registro para que viagens e histórico
// antigos continuem íntegros; uma viagem ativa precisa terminar antes da mudança.
export function definirEntregadorAtivo(empresaId, entregadorId, active) {
  const acesso = empresaAdministrada(empresaId);
  if (acesso.erro) return falha(acesso.erro);
  const dados = obterDados();
  const entregador = dados.couriers.find((courier) =>
    courier.id === entregadorId && courier.companyId === empresaId);
  if (!entregador) return falha("Entregador não encontrado neste estabelecimento.");
  if (!active && dados.trips.some((trip) =>
    trip.courierId === entregadorId && VIAGEM_ATIVA.includes(trip.state))) {
    return falha("Não é possível inativar um entregador com viagem em andamento.");
  }

  const anterior = entregador.active;
  return gravarComRollback(
    dados,
    () => { entregador.active = Boolean(active); },
    () => { entregador.active = anterior; },
  );
}

// [RF-EMP-11] O código de conexão tem um campo próprio na empresa. O código
// comercial continua reservado à localização da loja pelos clientes.
function codigoDeConexaoDisponivel(codigo, empresaId) {
  return !obterDados().companies.some((empresa) =>
    normalizarCodigo(empresa.code) === codigo
    || (empresa.id !== empresaId && normalizarCodigo(empresa.connectionCode) === codigo));
}

// [RF-EMP-11] Gera um código aleatório de 8 caracteres para a empresa da sessão.
// Cada renovação substitui o código anterior; não há expiração nem uso único.
export function gerarCodigoConexao(empresaId) {
  const acesso = empresaAdministrada(empresaId);
  if (acesso.erro) return falha(acesso.erro);

  const aleatorio = globalThis.crypto;
  if (!aleatorio || typeof aleatorio.getRandomValues !== "function") {
    return falha("Este navegador não oferece geração aleatória segura para criar o código.");
  }

  const empresa = obterEmpresa(empresaId);
  const codigoAnterior = empresa.connectionCode;
  let codigo = "";
  try {
    for (let tentativa = 0; tentativa < MAX_TENTATIVAS_CODIGO; tentativa += 1) {
      const bytes = aleatorio.getRandomValues(new Uint8Array(TAMANHO_CODIGO_CONEXAO));
      codigo = [...bytes]
        .map((byte) => ALFABETO_CODIGO_CONEXAO[byte % ALFABETO_CODIGO_CONEXAO.length])
        .join("");
      if (codigo !== codigoAnterior && codigoDeConexaoDisponivel(codigo, empresaId)) break;
      codigo = "";
    }
  } catch (erro) {
    return falha(`Não foi possível gerar o código de conexão: ${erro.message}`);
  }
  if (!codigo) return falha("Não foi possível gerar um código exclusivo. Tente novamente.");

  const resultado = gravarComRollback(
    obterDados(),
    () => { empresa.connectionCode = codigo; },
    () => {
      if (codigoAnterior === undefined) delete empresa.connectionCode;
      else empresa.connectionCode = codigoAnterior;
    },
  );
  return resultado.ok ? { ok: true, codigo } : resultado;
}
