import test from "node:test";
import assert from "node:assert/strict";
import { handleCommand, addExperience, createPlayer } from "./index.js";
import { SOCIAL_ACTIONS, formatSocialAction, isSocialPanelOwner } from "./social.js";

function memoryStore() {
  const players = new Map();
  return {
    async getPlayer(id) { return players.get(id) ?? null; },
    async savePlayer(player) { players.set(player.id, structuredClone(player)); return player; },
    async getAllPlayers() { return [...players.values()]; }
  };
}

test("cadastro cria uma ficha inicial", async () => {
  const repository = memoryStore();
  const reply = await handleCommand({ from: "discord:123456789012345678", text: "!registrar Sakura Haruno", repository, now: 1000 });
  const player = await repository.getPlayer("discord:123456789012345678");
  assert.match(reply, /Sakura Haruno/);
  assert.equal(player.level, 1);
  assert.equal(player.ryos, 100);
});

test("treino concede XP e respeita o intervalo", async () => {
  const repository = memoryStore();
  await repository.savePlayer(createPlayer("jogador", "Naruto", 1000));
  const first = await handleCommand({ from: "jogador", text: "!treinar", repository, now: 2000 });
  const second = await handleCommand({ from: "jogador", text: "!treinar", repository, now: 3000 });
  const player = await repository.getPlayer("jogador");
  assert.match(first, /25 XP/);
  assert.match(second, /treinou recentemente/i);
  assert.equal(player.xp, 25);
  assert.equal(player.ryos, 110);
});

test("XP suficiente aumenta nível e patente", () => {
  const player = createPlayer("jogador", "Hinata", 1000);
  const gained = addExperience(player, 120);
  assert.equal(gained, 1);
  assert.equal(player.level, 2);
  assert.equal(player.xp, 20);
  assert.equal(player.rank, "Genin");
});

test("missão concede recompensa uma vez por intervalo", async () => {
  const repository = memoryStore();
  await repository.savePlayer(createPlayer("jogador", "Kakashi", 1000));
  const reply = await handleCommand({ from: "jogador", text: "!missao 1", repository, now: 2000 });
  const player = await repository.getPlayer("jogador");
  assert.match(reply, /MISSÃO CONCLUÍDA/);
  assert.equal(player.missionsCompleted, 1);
  assert.equal(player.xp, 40);
  assert.equal(player.ryos, 130);
});

test("ações sociais têm GIFs e mensagens próprias", () => {
  assert.deepEqual(Object.keys(SOCIAL_ACTIONS), ["hug", "pat", "wave"]);
  for (const action of Object.values(SOCIAL_ACTIONS)) {
    assert.ok(action.gifs.length >= 2);
    assert.ok(action.gifs.every(url => url.startsWith("https://")));
  }
  assert.match(formatSocialAction("Momoka", "Naruto", "hug"), /Momoka.*Naruto/);
  assert.match(formatSocialAction("Momoka", "Sakura", "pat"), /carinho/);
  assert.match(formatSocialAction("Momoka", "Sasuke", "wave"), /acenou/);
});

test("painel social só pode ser controlado pelo dono", () => {
  assert.equal(isSocialPanelOwner("social:cat:interacoes:123", "123"), true);
  assert.equal(isSocialPanelOwner("social:target:hug:123", "456"), false);
  assert.equal(isSocialPanelOwner("social:back:123", "123"), true);
});
