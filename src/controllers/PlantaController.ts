import { Request, Response } from "express";
import { Luminosidade } from "@prisma/client";
import * as PlantaRepository from "@repositories/PlantaRepository";

// Confere só os campos enviados. Devolve a mensagem de erro ou null se estiver tudo certo.
const validarCampos = (dados: any): string | null => {
  const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = dados;

  if (nome !== undefined && !(typeof nome === "string" && nome.trim() !== "")) {
    return "nome deve ser um texto não vazio.";
  }

  if (especie !== undefined && !(typeof especie === "string" && especie.trim() !== "")) {
    return "especie deve ser um texto não vazio.";
  }

  if (preco !== undefined && !(Number.isInteger(preco) && preco > 0)) {
    return "preco deve ser um número inteiro maior que zero (em centavos).";
  }

  if (estoque !== undefined && !(Number.isInteger(estoque) && estoque >= 0)) {
    return "estoque deve ser um número inteiro maior ou igual a zero.";
  }

  if (regaACadaDias !== undefined && !(Number.isInteger(regaACadaDias) && regaACadaDias >= 1)) {
    return "regaACadaDias deve ser um número inteiro de pelo menos 1.";
  }

  if (petFriendly !== undefined && typeof petFriendly !== "boolean") {
    return "petFriendly deve ser true ou false.";
  }

  if (luminosidade !== undefined && !Object.values(Luminosidade).includes(luminosidade)) {
    return "luminosidade deve ser SOMBRA, MEIA_SOMBRA ou SOL_PLENO.";
  }

  return null;
};
// Converte o id da URL para número. Devolve o id ou null se for inválido.
const lerId = (idTexto: string): number | null => {
  const id = Number(idTexto);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
};

export const createPlanta = async (req: Request, res: Response) => {
  try {
    const dados = req.body ?? {};
    const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = dados;

    // No cadastro, todos os campos são obrigatórios
    if (
      nome === undefined ||
      especie === undefined ||
      preco === undefined ||
      estoque === undefined ||
      luminosidade === undefined ||
      petFriendly === undefined ||
      regaACadaDias === undefined
    ) {
      return res.status(400).json({
        message: "Preencha todos os campos: nome, especie, preco, estoque, luminosidade, petFriendly e regaACadaDias.",
      });
    }

    
    const erro = validarCampos(dados);
    if (erro) {
      return res.status(400).json({ message: erro });
    }

    // Manda para o banco só os campos da planta, nunca o req.body inteiro
    const planta = await PlantaRepository.createPlanta({
      nome,
      especie,
      preco,
      estoque,
      luminosidade,
      petFriendly,
      regaACadaDias,
    });

    return res.status(201).json(planta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao cadastrar planta." });
  }
};
export const readPlantaById = async (req: Request, res: Response) => {
  try {
    const id = lerId(req.params.id);
    if (id === null) {
      return res.status(400).json({ message: "O id deve ser um número inteiro positivo." });
    }

    const planta = await PlantaRepository.findPlantaById(id);
    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    return res.status(200).json(planta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar planta." });
  }
};

export const deletePlanta = async (req: Request, res: Response) => {
  try {
    const id = lerId(req.params.id);
    if (id === null) {
      return res.status(400).json({ message: "O id deve ser um número inteiro positivo." });
    }

    // Antes de apagar, confere se a planta existe
    const planta = await PlantaRepository.findPlantaById(id);
    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    await PlantaRepository.deletePlanta(id);

    // 204 No Content: deu certo e não há nada para devolver
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao deletar planta." });
  }
};

export const updatePlanta = async (req: Request, res: Response) => {
  try {
    const id = lerId(req.params.id);
    if (id === null) {
      return res.status(400).json({ message: "O id deve ser um número inteiro positivo." });
    }

    const dados = req.body ?? {};
    const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = dados;

    // No PATCH nenhum campo é obrigatório, mas os que vierem seguem as mesmas regras
    const erro = validarCampos(dados);
    if (erro) {
      return res.status(400).json({ message: erro });
    }

    // Antes de editar, confere se a planta existe
    const planta = await PlantaRepository.findPlantaById(id);
    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    // Campos não enviados chegam undefined, e o Prisma ignora campos undefined
    const plantaAtualizada = await PlantaRepository.updatePlanta(id, {
      nome,
      especie,
      preco,
      estoque,
      luminosidade,
      petFriendly,
      regaACadaDias,
    });

    return res.status(200).json(plantaAtualizada);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao atualizar planta." });
  }
};
export const readAllPlantas = async (req: Request, res: Response) => {
  try {
    const { luminosidade, petFriendly } = req.query;

    // Os filtros chegam da URL sempre como texto
    if (luminosidade !== undefined && !Object.values(Luminosidade).includes(luminosidade as Luminosidade)) {
      return res.status(400).json({ message: "Filtro luminosidade deve ser SOMBRA, MEIA_SOMBRA ou SOL_PLENO." });
    }

    if (petFriendly !== undefined && petFriendly !== "true" && petFriendly !== "false") {
      return res.status(400).json({ message: "Filtro petFriendly deve ser true ou false." });
    }

    const plantas = await PlantaRepository.findAllPlantas({
      luminosidade: luminosidade as Luminosidade | undefined,
      petFriendly: petFriendly === undefined ? undefined : petFriendly === "true",
    });

    return res.status(200).json(plantas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar plantas." });
  }
};

export const venderPlanta = async (req: Request, res: Response) => {
  try {
    const id = lerId(req.params.id);
    if (id === null) {
      return res.status(400).json({ message: "O id deve ser um número inteiro positivo." });
    }

    const { quantidade } = req.body ?? {};
    if (!(Number.isInteger(quantidade) && quantidade > 0)) {
      return res.status(400).json({ message: "quantidade deve ser um número inteiro maior que zero." });
    }

    const planta = await PlantaRepository.findPlantaById(id);
    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    if (planta.estoque < quantidade) {
      return res.status(400).json({
        message: `Estoque insuficiente: temos só ${planta.estoque} vasos de ${planta.nome}.`,
      });
    }

    const resultado = await PlantaRepository.venderPlanta(id, quantidade);

    // Se nenhuma linha mudou, outra venda levou o estoque entre a checagem e agora
    if (resultado.count === 0) {
      return res.status(400).json({ message: "Estoque insuficiente: outra venda foi feita ao mesmo tempo." });
    }

    const plantaAtualizada = await PlantaRepository.findPlantaById(id);
    return res.status(200).json(plantaAtualizada);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao registrar venda." });
  }
};

export const readValorTotalEstoque = async (req: Request, res: Response) => {
  try {
    const plantas = await PlantaRepository.findPrecoEEstoque();

    let valorTotalEmCentavos = 0;
    let totalDeVasos = 0;

    for (const planta of plantas) {
      valorTotalEmCentavos += planta.preco * planta.estoque;
      totalDeVasos += planta.estoque;
    }

    return res.status(200).json({ valorTotalEmCentavos, totalDeVasos });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao calcular valor do estoque." });
  }
};