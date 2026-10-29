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