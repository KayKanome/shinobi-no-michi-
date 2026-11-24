import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setupSocialInteractions } from "./social.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number.parseInt(process.env.PORT ?? "3000", 10);
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN ?? "";
const DATA_DIRECTORY = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIRECTORY, "players.json");
const DATABASE_URL = process.env.DATABASE_URL ?? "";
const MAX_BODY_BYTES = 1024 * 1024;
const TRAINING_COOLDOWN_MS = 60 * 60 * 1000;
const MISSION_COOLDOWN_MS = 3 * 60 * 60 * 1000;

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("PORT precisa ser um número entre 1 e 65535.");
}

export const missions = [
  { id: 1, name: "Entrega na área comercial", description: "Leve um pacote importante até a área comercial da vila.", xp: 40, ryos: 30 },
  { id: 2, name: "Ajuda na biblioteca", description: "Organize pergaminhos e ajude os moradores na biblioteca.", xp: 55, ryos: 40 },
  { id: 3, name: "Coleta de ervas", description: "Encontre ervas medicinais para a equipe da academia.", xp: 70, ryos: 50 }
];

export function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export function rankForLevel(level) {
  if (level >= 10) return "Jounin";
  if (level >= 5) return "Chuunin";
  if (level >= 2) return "Genin";
  return "Estudante";
}

export function createPlayer(id, name, now = new Date()) {
  return {
    id,
    name,
    village: "Konohagakure",
    clan: "Sem clã",
    rank: "Estudante",
    level: 1,
    xp: 0,
    ryos: 100,
    chakra: 100,
    maxChakra: 100,
    missionsCompleted: 0,
    lastTrainingAt: null,
    lastMissionAt: null,
    createdAt: new Date(now).toISOString()
  };
}

export function addExperience(player, amount) {
  if (!Number.isFinite(amount) || amount < 0) throw new Error("Quantidade de XP inválida.");
  player.xp += amount;
  let levelsGained = 0;
  while (player.xp >= player.level * 100) {
    player.xp -= player.level * 100;
    player.level += 1;
    levelsGained += 1;
  }
  player.rank = rankForLevel(player.level);
  return levelsGained;
}

function remainingTime(lastAction, cooldown, now) {
  if (!lastAction) return 0;
  const elapsed = now - new Date(lastAction).getTime();
  return Math.max(0, cooldown - elapsed);
}

function formatRemaining(milliseconds) {
  const totalMinutes = Math.ceil(milliseconds / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}min`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}min`;
}

function helpMessage() {
  return [
    "*SHINOBI NO MICHI — MENU*",
    "",
    "• !registrar Nome — criar personagem",
    "• !ficha — ver seus dados",
    "• !treinar — ganhar experiência e Ryos",
    "• !missoes — ver missões disponíveis",
    "• !missao 1 — realizar uma missão",
    "• !ranking — ver os shinobi em destaque",
    "• !ajuda — mostrar este menu",
    "",
    "Comece com: !registrar Naruto"
  ].join("\n");
}

export async function handleCommand({ from, text, repository, now = Date.now() }) {
  if (!repository) throw new Error("O armazenamento de jogadores não foi configurado.");
  const raw = String(text ?? "").trim();
  if (!raw.startsWith("!")) return "Olá! Para ver os comandos do RPG, envie !ajuda.";

  const parts = raw.slice(1).trim().split(/\s+/);
  const command = normalizeText(parts.shift());
  const argument = parts.join(" ").trim();

  if (["ajuda", "help", "menu"].includes(command)) return helpMessage();

  if (command === "registrar") {
    const name = argument.replace(/\s+/g, " ");
    const validName = /^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u.test(name);
    if (name.length < 2 || name.length > 20 || !validName) {
      return "Escolha um nome de 2 a 20 letras. Exemplo: !registrar Naruto Uzumaki";
    }
    const existing = await repository.getPlayer(from);
    if (existing) return `Você já tem um personagem, *${existing.name}*. Envie !ficha para consultar sua ficha.`;
    const player = createPlayer(from, name, now);
    await repository.savePlayer(player);
    return [
      `Bem-vindo ao mundo shinobi, *${player.name}*!`,
      "",
      "Sua jornada começa em *Konohagakure*.",
      "Patente: Estudante",
      "Nível: 1 | XP: 0/100",
      "Ryos: 100",
      "",
      "Envie !ajuda para conhecer os comandos."
    ].join("\n");
  }

  if (command === "ficha") {
    const player = await repository.getPlayer(from);
    if (!player) return "Você ainda não tem personagem. Crie um com !registrar SeuNome.";
    return [
      `*FICHA DE ${player.name.toLocaleUpperCase("pt-BR")}*`,
      `Vila: ${player.village}`,
      `Clã: ${player.clan}`,
      `Patente: ${player.rank}`,
      `Nível: ${player.level}`,
      `Experiência: ${player.xp}/${player.level * 100} XP`,
      `Chakra: ${player.chakra}/${player.maxChakra}`,
      `Ryos: ${player.ryos}`,
      `Missões concluídas: ${player.missionsCompleted}`
    ].join("\n");
  }

  if (command === "treinar") {
    const player = await repository.getPlayer(from);
    if (!player) return "Você precisa criar seu personagem primeiro: !registrar SeuNome.";
    const wait = remainingTime(player.lastTrainingAt, TRAINING_COOLDOWN_MS, now);
    if (wait > 0) return `Você já treinou recentemente. Tente novamente em ${formatRemaining(wait)}.`;
    player.lastTrainingAt = new Date(now).toISOString();
    player.ryos += 10;
    const gainedLevels = addExperience(player, 25);
    await repository.savePlayer(player);
    const levelMessage = gainedLevels > 0 ? `\nVocê avançou para o nível *${player.level}* e agora é *${player.rank}*!` : "";
    return `Treino concluído! Você ganhou *25 XP* e *10 Ryos*.${levelMessage}\nEnvie !ficha para ver sua evolução.`;
  }

  if (command === "missoes") {
    return [
      "*QUADRO DE MISSÕES*",
      ...missions.map((mission) => `${mission.id}. *${mission.name}* — ${mission.xp} XP e ${mission.ryos} Ryos`),
      "",
      "Para realizar uma, envie !missao número. Exemplo: !missao 1",
      "Você pode concluir uma missão a cada 3 horas."
    ].join("\n");
  }

  if (command === "missao") {
    const player = await repository.getPlayer(from);
    if (!player) return "Você precisa criar seu personagem primeiro: !registrar SeuNome.";
    if (!/^\d+$/.test(argument)) return "Informe o número da missão. Envie !missoes para ver o quadro.";
    const mission = missions.find((item) => item.id === Number(argument));
    if (!mission) return "Missão não encontrada. Envie !missoes para consultar o quadro.";
    const wait = remainingTime(player.lastMissionAt, MISSION_COOLDOWN_MS, now);
    if (wait > 0) return `Você já concluiu uma missão recentemente. Volte em ${formatRemaining(wait)}.`;
    player.lastMissionAt = new Date(now).toISOString();
    player.missionsCompleted += 1;
    player.ryos += mission.ryos;
    const gainedLevels = addExperience(player, mission.xp);
    await repository.savePlayer(player);
    const levelMessage = gainedLevels > 0 ? `\nVocê avançou para o nível *${player.level}* e agora é *${player.rank}*!` : "";
    return [
      `*MISSÃO CONCLUÍDA: ${mission.name}*`,
      mission.description,
      `Recompensa: *${mission.xp} XP* e *${mission.ryos} Ryos*.`,
      `Missões concluídas: ${player.missionsCompleted}.${levelMessage}`
    ].join("\n");
  }

  if (["ranking", "rank"].includes(command)) {
    const players = await repository.getAllPlayers();
    if (players.length === 0) return "Ainda não há shinobi registrados. Seja o primeiro com !registrar SeuNome.";
    const topPlayers = players
      .sort((a, b) => (b.level * 1000 + b.xp) - (a.level * 1000 + a.xp))
      .slice(0, 5);
    return [
      "*RANKING SHINOBI*",
      ...topPlayers.map((player, index) => `${index + 1}. *${player.name}* — Nv. ${player.level} (${player.rank})`)
    ].join("\n");
  }

  return "Não reconheci esse comando. Envie !ajuda para ver a lista.";
}

let writeQueue = Promise.resolve();

async function readDatabase() {
  try {
    const content = await fs.readFile(DATA_FILE, "utf8");
    const database = JSON.parse(content);
    if (!database || typeof database !== "object" || !database.players || typeof database.players !== "object") {
      throw new Error("O arquivo de dados está em um formato inválido.");
    }
    if (!Array.isArray(database.processedMessageIds)) database.processedMessageIds = [];
    return database;
  } catch (error) {
    if (error.code === "ENOENT") return { players: {}, processedMessageIds: [] };
    throw error;
  }
}

async function writeDatabase(database) {
  await fs.mkdir(DATA_DIRECTORY, { recursive: true });
  const temporaryFile = `${DATA_FILE}.${process.pid}.tmp`;
  await fs.writeFile(temporaryFile, JSON.stringify(database, null, 2), "utf8");
  await fs.rename(temporaryFile, DATA_FILE);
}

function serializeWrite(operation) {
  const result = writeQueue.then(operation);
  writeQueue = result.catch(() => {});
  return result;
}

const localStore = {
  async getPlayer(id) {
    await writeQueue;
    const database = await readDatabase();
    return database.players[id] ?? null;
  },
  async savePlayer(player) {
    return serializeWrite(async () => {
      const database = await readDatabase();
      database.players[player.id] = player;
      await writeDatabase(database);
      return player;
    });
  },
  async getAllPlayers() {
    await writeQueue;
    const database = await readDatabase();
    return Object.values(database.players);
  },
  async claimMessage(messageId) {
    return serializeWrite(async () => {
      const database = await readDatabase();
      if (database.processedMessageIds.includes(messageId)) return false;
      database.processedMessageIds.push(messageId);
      if (database.processedMessageIds.length > 5000) database.processedMessageIds.splice(0, database.processedMessageIds.length - 5000);
      await writeDatabase(database);
      return true;
    });
  }
};

function createPostgresStore() {
  let pool;
  let initialization;

  async function initialize() {
    if (!initialization) {
      initialization = (async () => {
        const { Pool } = await import("pg");
        pool = new Pool({
          connectionString: DATABASE_URL,
          max: 5,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000
        });
        await pool.query(`
          CREATE TABLE IF NOT EXISTS shinobi_players (
            id TEXT PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `);
        await pool.query(`
          CREATE TABLE IF NOT EXISTS shinobi_processed_messages (
            message_id TEXT PRIMARY KEY,
            processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `);
        await pool.query(`
          CREATE TABLE IF NOT EXISTS shinobi_family_adoptions (
            id BIGSERIAL PRIMARY KEY,
            parent_id TEXT NOT NULL,
            child_id TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            responded_at TIMESTAMPTZ,
            CHECK (parent_id <> child_id)
          )
        `);
        await pool.query(`
          CREATE UNIQUE INDEX IF NOT EXISTS shinobi_family_active_pair
          ON shinobi_family_adoptions (parent_id, child_id)
          WHERE status IN ('pending', 'accepted')
        `);
      })().catch((error) => {
        initialization = null;
        throw error;
      });
    }
    return initialization;
  }

  return {
    initialize,
    async getPlayer(id) {
      await initialize();
      const result = await pool.query(
        "SELECT data FROM shinobi_players WHERE id = $1",
        [id]
      );
      return result.rows[0]?.data ?? null;
    },
    async savePlayer(player) {
      await initialize();
      await pool.query(
        `INSERT INTO shinobi_players (id, data, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (id) DO UPDATE
         SET data = EXCLUDED.data, updated_at = NOW()`,
        [player.id, JSON.stringify(player)]
      );
      return player;
    },
    async getAllPlayers() {
      await initialize();
      const result = await pool.query("SELECT data FROM shinobi_players");
      return result.rows.map((row) => row.data);
    },
    async claimMessage(messageId) {
      await initialize();
      const result = await pool.query(
        `INSERT INTO shinobi_processed_messages (message_id)
         VALUES ($1)
         ON CONFLICT (message_id) DO NOTHING
         RETURNING message_id`,
        [messageId]
      );
      return result.rowCount === 1;
    },
    async createAdoptionRequest(parentId, childId) {
      await initialize();
      const result = await pool.query(
        `INSERT INTO shinobi_family_adoptions (parent_id, child_id, status)
         VALUES ($1, $2, 'pending')
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [parentId, childId]
      );
      return result.rowCount === 1 ? "created" : "duplicate";
    },
    async getFamily(userId) {
      await initialize();
      const [parents, children] = await Promise.all([
        pool.query(
          `SELECT p.data->>'name' AS name
           FROM shinobi_family_adoptions a
           JOIN shinobi_players p ON p.id = a.parent_id
           WHERE a.child_id = $1 AND a.status = 'accepted'
           ORDER BY a.responded_at`,
          [userId]
        ),
        pool.query(
          `SELECT p.data->>'name' AS name
           FROM shinobi_family_adoptions a
           JOIN shinobi_players p ON p.id = a.child_id
           WHERE a.parent_id = $1 AND a.status = 'accepted'
           ORDER BY a.responded_at`,
          [userId]
        )
      ]);
      return { parents: parents.rows, children: children.rows };
    },
    async getPendingAdoptions(childId) {
      await initialize();
      const result = await pool.query(
        `SELECT a.parent_id AS "parentId", p.data->>'name' AS "parentName"
         FROM shinobi_family_adoptions a
         JOIN shinobi_players p ON p.id = a.parent_id
         WHERE a.child_id = $1 AND a.status = 'pending'
         ORDER BY a.created_at`,
        [childId]
      );
      return result.rows.map(row => ({
        ...row,
        parentDiscordId: String(row.parentId).replace(/^discord:/, "")
      }));
    },
    async declineAdoptionRequest(parentId, childId) {
      await initialize();
      const result = await pool.query(
        `UPDATE shinobi_family_adoptions
         SET status = 'declined', responded_at = NOW()
         WHERE parent_id = $1 AND child_id = $2 AND status = 'pending'`,
        [parentId, childId]
      );
      return result.rowCount === 1;
    },
    async acceptAdoptionRequest(parentId, childId) {
      await initialize();
      const connection = await pool.connect();
      try {
        await connection.query("BEGIN");
        const request = await connection.query(
          `SELECT id FROM shinobi_family_adoptions
           WHERE parent_id = $1 AND child_id = $2 AND status = 'pending'
           FOR UPDATE`,
          [parentId, childId]
        );
        if (request.rowCount !== 1) {
          await connection.query("ROLLBACK");
          return "missing";
        }
        const cycle = await connection.query(
          `WITH RECURSIVE descendants(id) AS (
             SELECT child_id FROM shinobi_family_adoptions
             WHERE parent_id = $1 AND status = 'accepted'
             UNION
             SELECT a.child_id FROM shinobi_family_adoptions a
             JOIN descendants d ON a.parent_id = d.id
             WHERE a.status = 'accepted'
           )
           SELECT 1 FROM descendants WHERE id = $2 LIMIT 1`,
          [childId, parentId]
        );
        if (cycle.rowCount > 0) {
          await connection.query("ROLLBACK");
          return "cycle";
        }
        await connection.query(
          `UPDATE shinobi_family_adoptions
           SET status = 'accepted', responded_at = NOW()
           WHERE id = $1`,
          [request.rows[0].id]
        );
        await connection.query("COMMIT");
        return "accepted";
      } catch (error) {
        await connection.query("ROLLBACK").catch(() => {});
        if (error.code === "23505") return "exists";
        throw error;
      } finally {
        connection.release();
      }
    },
    async close() {
      if (pool) await pool.end();
    }
  };
}

// Em produção, use DATABASE_URL para que reinicializações não apaguem os personagens.
export const store = DATABASE_URL ? createPostgresStore() : localStore;

export async function startDiscordBot() {
  if (!DISCORD_BOT_TOKEN) {
    console.log("Discord desativado: configure DISCORD_BOT_TOKEN para conectar a Momoka.");
    return null;
  }

  const { Client, GatewayIntentBits } = await import("discord.js");
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });
  await setupSocialInteractions(client, store);

  client.once("ready", () => {
    console.log(`Momoka conectada ao Discord como ${client.user.tag}.`);
  });

  client.on("messageCreate", async (message) => {
    try {
      if (!message.guild || message.author.bot || !message.content.trim()) return;
      if (!message.content.trim().startsWith("!")) return;

      const firstDelivery = await store.claimMessage(`discord:${message.id}`);
      if (!firstDelivery) return;
      console.log("Comando recebido no Discord:", JSON.stringify(message.content));

      const reply = await handleCommand({
        from: `discord:${message.author.id}`,
        text: message.content,
        repository: store
      });
      if (reply) await message.channel.send({ content: reply.slice(0, 1900), allowedMentions: { repliedUser: false } });
    } catch (error) {
      console.error("Falha ao processar mensagem do Discord:", error.message);
      if (message.channel?.isTextBased()) {
        await message.channel.send("A Momoka encontrou um problema ao processar esse comando. Tente novamente em instantes.").catch(() => {});
      }
    }
  });

  await client.login(DISCORD_BOT_TOKEN);
  return client;
}

function send(response, statusCode, body, contentType = "text/plain; charset=utf-8") {
  response.writeHead(statusCode, {
    "Content-Type": contentType,
    "Cache-Control": "no-store"
  });
  response.end(body);
}

export async function startServer() {
  if (process.env.NODE_ENV === "production" && !DATABASE_URL) {
    throw new Error("DATABASE_URL é obrigatório em produção para proteger o progresso dos jogadores.");
  }
  if (typeof store.initialize === "function") await store.initialize();
  const discordClient = await startDiscordBot();

  const server = http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

    if (request.method === "GET" && requestUrl.pathname === "/health") {
      return send(response, 200, JSON.stringify({
        ok: true,
        name: "Shinobi no Michi",
        platform: "discord"
      }), "application/json; charset=utf-8");
    }

    return send(response, 404, "Rota não encontrada.");
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Shinobi no Michi ativo na porta ${PORT}.`);
    console.log("Integração ativa: Discord Gateway.");
  });

  const shutdown = () => server.close(async () => {
    try {
      if (discordClient) await discordClient.destroy();
      if (typeof store.close === "function") await store.close();
    } finally {
      process.exit(0);
    }
  });
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startServer().catch((error) => {
    console.error("Não foi possível iniciar o Shinobi no Michi:", error.message);
    process.exitCode = 1;
  });
}
