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