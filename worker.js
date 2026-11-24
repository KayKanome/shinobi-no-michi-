import { store, startDiscordBot } from "./index.js";

async function main() {
  if (!process.env.DISCORD_BOT_TOKEN) {
    throw new Error("DISCORD_BOT_TOKEN é obrigatório para iniciar a Momoka como worker.");
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL é obrigatório para proteger os dados dos jogadores.");
  }

  if (typeof store.initialize === "function") await store.initialize();
  const client = await startDiscordBot();

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Encerrando worker da Momoka (${signal}).`);
    try {
      if (client) await client.destroy();
      if (typeof store.close === "function") await store.close();
      process.exit(0);
    } catch (error) {
      console.error("Falha ao encerrar o worker:", error.message);
      process.exit(1);
    }
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  console.log("Worker da Momoka iniciado; conexão Discord ativa.");
}

main().catch((error) => {
  console.error("Não foi possível iniciar o worker da Momoka:", error.message);
  process.exit(1);
});
