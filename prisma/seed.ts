import { PrismaClient, Luminosidade } from "@prisma/client";

const prisma = new PrismaClient();

// Plantas de exemplo. Preço em centavos (8990 = R$ 89,90)
const plantas = [
  { nome: "Costela-de-adão", especie: "Monstera deliciosa", preco: 8990, estoque: 12, luminosidade: Luminosidade.MEIA_SOMBRA, petFriendly: false, regaACadaDias: 7 },
  { nome: "Samambaia", especie: "Nephrolepis exaltata", preco: 4590, estoque: 0, luminosidade: Luminosidade.MEIA_SOMBRA, petFriendly: true, regaACadaDias: 2 },
  { nome: "Espada-de-são-jorge", especie: "Dracaena trifasciata", preco: 3990, estoque: 20, luminosidade: Luminosidade.SOMBRA, petFriendly: false, regaACadaDias: 15 },
  { nome: "Jiboia", especie: "Epipremnum aureum", preco: 2990, estoque: 8, luminosidade: Luminosidade.MEIA_SOMBRA, petFriendly: false, regaACadaDias: 5 },
  { nome: "Maranta", especie: "Maranta leuconeura", preco: 5490, estoque: 0, luminosidade: Luminosidade.SOMBRA, petFriendly: true, regaACadaDias: 3 },
  { nome: "Echeveria", especie: "Echeveria elegans", preco: 1990, estoque: 30, luminosidade: Luminosidade.SOL_PLENO, petFriendly: true, regaACadaDias: 10 },
];

const main = async () => {
  // Só cria as plantas se o banco estiver vazio, para não duplicar ao rodar de novo
  const quantidade = await prisma.planta.count();
  if (quantidade > 0) {
    console.log(`O banco já tem ${quantidade} plantas. Seed não executado.`);
    return;
  }

  await prisma.planta.createMany({ data: plantas });
  console.log(`${plantas.length} plantas de exemplo criadas.`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
