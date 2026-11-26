import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } from "discord.js";

const GAMES = {
  word: { name: "Palavra Shinobi", emoji: "📜" },
  quiz: { name: "Quiz Shinobi", emoji: "🧠" },
  who: { name: "Quem sou eu?", emoji: "🔎" },
  dice: { name: "Desafio dos dados", emoji: "🎲" }
};
const sessions = new Map();
const rooms = new Map();
const TOTAL_ROUNDS = 10;
const ROUND_MS = 20000;
const WORDS = [
  ["KONOHA", "CHAKRA", "NINJA", "RAMEN", "KUNAI"],
  ["SHARINGAN", "RASENGAN", "HOKAGE", "AKATSUKI", "BYAKUGAN"],
  ["TSUKUYOMI", "SUSANOO", "CHIDORI", "SENJUTSU", "KAMUI"],
  ["KAMINARI", "SHINOBI", "KUCHIYOSE", "MANGEKYO", "JUTSU"],
  ["KAGEBUNSHIN", "AMATERASU", "IZANAGI", "TAIJUTSU", "GENJUTSU"],
  ["KOTOAMATSUKAMI", "RINNEGAN", "SHINRA TENSEI", "EDO TENSEI", "RASENSHURIKEN"],
  ["MOKUTON", "SUSANOO", "KAGUYA", "JIGEN", "KARMA"],
  ["INFINITE TSUKUYOMI", "OTSUTSUKI", "KAMUI", "IZANAMI", "SHINJUTSU"],
  ["SHIBAI", "DAIKOKUTEN", "LIMBO", "YOMOTSU HIRASAKA", "KARMA"],
  ["KOTOAMATSUKAMI", "MUGEN TSUKUYOMI", "YOMOTSU HIRASAKA", "DAIKOKUTEN", "SHINJUTSU"]
];
const QUIZ = [
  ["Qual é a vila de Naruto?", ["Konoha", "Suna", "Kiri", "Iwa"], 0],
  ["Qual é o sobrenome de Sakura?", ["Uchiha", "Haruno", "Hyuga", "Nara"], 1],
  ["Qual elemento é associado ao Sasuke?", ["Água", "Terra", "Fogo", "Vento"], 2],
  ["Quem é conhecido como o Ninja Copiador?", ["Jiraiya", "Kakashi", "Iruka", "Neji"], 1],
  ["Qual é o nome da raposa selada em Naruto?", ["Matatabi", "Kurama", "Gyuki", "Shukaku"], 1],
  ["Quem liderou a Akatsuki usando o nome Pain?", ["Nagato", "Obito", "Itachi", "Kisame"], 0],
  ["Qual clã é conhecido pelo Byakugan?", ["Nara", "Akimichi", "Hyuga", "Aburame"], 2],
  ["Qual técnica é marca registrada de Minato?", ["Hiraishin", "Chidori", "Amaterasu", "Kirin"], 0],
  ["Quem criou o Edo Tensei?", ["Tobirama", "Hashirama", "Hiruzen", "Minato"], 0],
  ["Qual é o nome do poder ocular de Kaguya?", ["Rinnegan", "Byakugan", "Sharingan", "Rinne Sharingan"], 3]
];
const WHO = [
  ["Sou o protagonista e sonho em ser Hokage.", ["Naruto", "Sasuke", "Kiba", "Sai"], 0],
  ["Sou o Ninja Copiador e fui líder do Time 7.", ["Kakashi", "Guy", "Asuma", "Iruka"], 0],
  ["Sou conhecido pela inteligência e por dizer 'que problemático'.", ["Shikamaru", "Shino", "Neji", "Rock Lee"], 0],
  ["Sou uma sannin lendária e especialista em medicina.", ["Tsunade", "Konan", "Temari", "Kurenai"], 0],
  ["Sou irmão mais velho de Sasuke e membro da Akatsuki.", ["Itachi", "Madara", "Obito", "Deidara"], 0],
  ["Fui o Quarto Hokage e sou conhecido como Relâmpago Amarelo.", ["Minato", "Tobirama", "Hiruzen", "Kakashi"], 0],
  ["Sou o líder original da Akatsuki e usuário do Rinnegan.", ["Nagato", "Kisame", "Zetsu", "Hidan"], 0],
  ["Meu sonho era provar que esforço pode superar talento.", ["Rock Lee", "Neji", "Sasuke", "Shino"], 0],
  ["Sou conhecido como Deus Shinobi e cofundador de Konoha.", ["Hashirama", "Tobirama", "Hiruzen", "Danzo"], 0],
  ["Sou integrante do clã Otsutsuki e mãe do chakra.", ["Kaguya", "Hinata", "Sakura", "Karin"], 0]
];

function shuffle(list, seed) {
  const a = [...list]; let n = seed + 31;
  for (let i = a.length - 1; i > 0; i--) {
    n = (n * 9301 + 49297) % 233280;
    const j = Math.floor(n / 233280 * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function question(kind, round, seed) {
  if (kind === "word") {
    const pool = WORDS[round - 1];
    const answer = pool[(seed + round) % pool.length];
    let letters = shuffle(answer.replace(/\s/g, "").split(""), seed + round);
    if (letters.join("") === answer.replace(/\s/g, "")) letters.reverse();
    const other = shuffle(WORDS.flat().filter(x => x !== answer), seed + round).slice(0, 3);
    const choices = shuffle([answer, ...other], seed + 44);
    return { title: "📜 Palavra Shinobi", prompt: "**Nível " + round + "/10**\nDesembaralhe as letras:\n\n# " + letters.join(" "), choices, answer: choices.indexOf(answer), explanation: "A palavra era **" + answer + "**." };
  }
  if (kind === "quiz" || kind === "who") {
    const item = (kind === "quiz" ? QUIZ : WHO)[round - 1];
    return { title: GAMES[kind].emoji + " " + GAMES[kind].name, prompt: "**Nível " + round + "/10**\n" + item[0], choices: item[1], answer: item[2], explanation: "Resposta: **" + item[1][item[2]] + "**." };
  }
  const a = 1 + ((seed * 3 + round * 2) % (round + 5));
  const b = 1 + ((seed * 7 + round * 3) % (round + 5));
  const sum = a + b;
  const choices = shuffle([sum, sum + 1, Math.max(2, sum - 2), sum + 3], seed + round).map(String);
  return { title: "🎲 Desafio dos dados", prompt: "**Nível " + round + "/10**\nQual é a soma dos dois dados?\n\n# 🎲 " + a + " + " + b + " = ?", choices, answer: choices.indexOf(String(sum)), explanation: "A soma correta é **" + sum + "**." };
}
function code() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }
function buttons(session) {
  return [new ActionRowBuilder().addComponents(session.question.choices.map((value, i) =>
    new ButtonBuilder().setCustomId("games:answer:" + session.id + ":" + session.round + ":" + i).setLabel(String(value).slice(0, 80)).setStyle(ButtonStyle.Primary)
  ))];
}
function modePanel(owner) {
  const embed = new EmbedBuilder().setColor(0xE89BB5).setTitle("🎮 Jogos Shinobi")
    .setDescription("Escolha um jogo e o modo de partida. São 10 rodadas, dificuldade progressiva e 20 segundos por resposta.\n\nNo multiplayer, todos respondem às mesmas perguntas. Errar não tira pontos nem Ryō.");
  const rows = Object.entries(GAMES).map(([key, game]) => new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("games:solo:" + key + ":" + owner).setLabel(game.emoji + " " + game.name).setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("games:multi:" + key + ":" + owner).setLabel("Multiplayer").setStyle(ButtonStyle.Success)
  ));
  rows.push(new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("games:rank:all:" + owner).setLabel("🏆 Ranking geral").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("games:rank:choose:" + owner).setLabel("Rankings por jogo").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("social:back:" + owner).setLabel("Voltar").setEmoji("⬅️").setStyle(ButtonStyle.Secondary)
  ));
  return { embeds: [embed], components: rows };
}
export function buildGamesPanel(owner) { return modePanel(owner); }
export const gameSlashCommands = [
  new SlashCommandBuilder().setName("jogo").setDescription("Abre os jogos da Momoka."),
  new SlashCommandBuilder().setName("ranking_jogos").setDescription("Mostra o ranking geral dos jogos.")
];
function lobby(room) {
  const names = [...room.players.values()].map(p => "• <@" + p.id + ">").join("\n");
  const embed = new EmbedBuilder().setColor(0xE89BB5).setTitle("🎮 Sala " + room.code + " — " + GAMES[room.kind].name)
    .setDescription("Anfitrião: <@" + room.hostId + ">\n\n**Participantes (" + room.players.size + ")**\n" + names + "\n\nMínimo: 2 jogadores. O anfitrião inicia quando todos estiverem prontos.");
  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("games:join:" + room.code).setLabel("Entrar na sala").setEmoji("🙋").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("games:start:" + room.code).setLabel("Iniciar partida").setEmoji("🚀").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("games:cancel:" + room.code).setLabel("Cancelar").setStyle(ButtonStyle.Secondary)
  )] };
}
async function render(session) {
  clearTimeout(session.timer);
  session.answers.clear();
  const scores = [...session.players.values()].map(p => p.name + ": **" + (session.score.get(p.id) || 0) + " pts**").join("\n");
  const embed = new EmbedBuilder().setColor(0xE89BB5).setTitle(session.question.title + " • Rodada " + session.round + "/10")
    .setDescription(session.question.prompt + "\n\n⏱️ **20 segundos**" + (session.mode === "multi" ? "\n\n**Placar**\n" + scores : ""));
  await session.message.edit({ embeds: [embed], components: buttons(session) });
  session.status = "playing";
  session.timer = setTimeout(() => {
    if (session.status !== "playing") return;
    if (session.mode === "solo") void soloResult(session, false, true);
    else void multiplayerResult(session, true);
  }, ROUND_MS);
}
async function saveScore(repository, id, kind, points, correct) {
  const player = await repository.getPlayer("discord:" + id);
  if (!player) return;
  const s = player.gameStats || { totalPoints: 0, gamesPlayed: 0, byGame: {}, achievements: [] };
  s.totalPoints = (s.totalPoints || 0) + points;
  s.gamesPlayed = (s.gamesPlayed || 0) + 1;
  s.byGame[kind] = s.byGame[kind] || { points: 0, played: 0, correct: 0 };
  s.byGame[kind].points += points; s.byGame[kind].played += 1; s.byGame[kind].correct += correct;
  s.achievements = s.achievements || [];
  if (!s.achievements.includes("Primeira Partida")) s.achievements.push("Primeira Partida");
  if (s.totalPoints >= 100 && !s.achievements.includes("Espírito Competitivo")) s.achievements.push("Espírito Competitivo");
  if (s.byGame[kind].correct >= 10 && !s.achievements.includes("Mestre " + GAMES[kind].name)) s.achievements.push("Mestre " + GAMES[kind].name);
  player.gameStats = s;
  await repository.savePlayer(player);
}
async function end(session) {
  clearTimeout(session.timer); session.status = "finished";
  const result = [];
  for (const p of session.players.values()) {
    const points = session.score.get(p.id) || 0;
    await saveScore(session.repository, p.id, session.kind, points, session.correct.get(p.id) || 0);
    result.push({ name: p.name, points });
  }
  result.sort((a, b) => b.points - a.points);
  const lines = result.map((p, i) => (i + 1) + ". **" + p.name + "** — " + p.points + " pts").join("\n");
  const embed = new EmbedBuilder().setColor(0xE89BB5).setTitle("🏆 Partida concluída!")
    .setDescription(lines + "\n\nResultado salvo no ranking! Medalhas e títulos são registrados no perfil. Ryō não é perdido por errar.");
  await session.message.edit({ embeds: [embed], components: [] });
  sessions.delete(session.id);
  if (session.roomCode) rooms.delete(session.roomCode);
}
async function soloResult(session, correct, timeout = false) {
  if (session.status !== "playing") return;
  clearTimeout(session.timer);
  if (correct) {
    const points = 10 + session.round * 2;
    session.score.set(session.hostId, session.score.get(session.hostId) + points);
    session.correct.set(session.hostId, session.correct.get(session.hostId) + 1);
  }
  const embed = new EmbedBuilder().setColor(correct ? 0x8DBB83 : 0xD97878)
    .setTitle(correct ? "🎉 Muito bem! Você acertou!" : timeout ? "⏰ O tempo acabou!" : "🌸 Boa tentativa!")
    .setDescription((correct ? "A Momoka está orgulhosa! +" + (10 + session.round * 2) + " pontos.\n" : "Continue tentando! Errar faz parte do aprendizado.\n") + session.question.explanation + "\n\n**Pontuação:** " + session.score.get(session.hostId) + " pts");
  const label = session.round === TOTAL_ROUNDS ? "Ver resultado" : "Próxima rodada";
  await session.message.edit({ embeds: [embed], components: [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("games:next:" + session.id + ":" + session.round).setLabel(label).setEmoji("➡️").setStyle(ButtonStyle.Success)
  )] });
  session.status = "between";
}
async function multiplayerResult(session, timeout = false) {
  if (session.status !== "playing") return;
  clearTimeout(session.timer);
  const lines = [];
  for (const p of session.players.values()) {
    const correct = session.answers.get(p.id) === session.question.answer;
    if (correct) {
      const points = 10 + session.round * 2;
      session.score.set(p.id, session.score.get(p.id) + points);
      session.correct.set(p.id, session.correct.get(p.id) + 1);
    }
    lines.push((correct ? "✅ " : "❌ ") + "<@" + p.id + "> " + (correct ? "+" + (10 + session.round * 2) : "+0") + " pts");
  }
  const embed = new EmbedBuilder().setColor(0xE89BB5).setTitle("📊 Resultado da rodada " + session.round)
    .setDescription(session.question.explanation + "\n\n" + lines.join("\n") + (timeout ? "\n\nO tempo terminou." : ""));
  await session.message.edit({ embeds: [embed], components: [] });
  if (session.round >= TOTAL_ROUNDS) return end(session);
  session.status = "between";
  session.timer = setTimeout(async () => {
    if (session.status !== "between") return;
    session.round++; session.question = question(session.kind, session.round, Date.now() % 100000);
    await render(session);
  }, 2500);
}
async function ranking(interaction, repository, kind) {
  const players = await repository.getAllPlayers();
  const rows = players.map(p => ({ name: p.name, stats: p.gameStats || {} }))
    .filter(p => kind === "all" ? p.stats.totalPoints > 0 : p.stats.byGame?.[kind]?.points > 0)
    .sort((a, b) => kind === "all" ? b.stats.totalPoints - a.stats.totalPoints : b.stats.byGame[kind].points - a.stats.byGame[kind].points).slice(0, 10);
  const desc = rows.length ? rows.map((p, i) => (i + 1) + ". **" + p.name + "** — " + (kind === "all" ? p.stats.totalPoints : p.stats.byGame[kind].points) + " pts").join("\n") : "Ainda não há pontuações. Seja o primeiro a jogar!";
  const title = kind === "all" ? "🏆 Ranking geral dos jogos" : GAMES[kind].emoji + " Ranking — " + GAMES[kind].name;
  return interaction.update({ embeds: [new EmbedBuilder().setColor(0xE89BB5).setTitle(title).setDescription(desc)], components: [] });
}
export async function handleGamesCommand(interaction, repository) {
  if (interaction.commandName === "jogo") return interaction.reply({ ...modePanel(interaction.user.id), ephemeral: true });
  const players = await repository.getAllPlayers();
  const rows = players.map(p => ({ name: p.name, stats: p.gameStats || {} })).filter(p => (p.stats.totalPoints || 0) > 0).sort((a, b) => b.stats.totalPoints - a.stats.totalPoints).slice(0, 10);
  const desc = rows.length ? rows.map((p, i) => (i + 1) + ". **" + p.name + "** — " + p.stats.totalPoints + " pts").join("\n") : "Ainda não há pontuações. Seja o primeiro a jogar!";
  return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xE89BB5).setTitle("🏆 Ranking geral dos jogos").setDescription(desc)], ephemeral: true });
}
export async function handleGamesInteraction(interaction, repository) {
  if (!interaction.customId?.startsWith("games:")) return false;
  const p = interaction.customId.split(":"); const action = p[1];
  if (action === "solo" || action === "multi") {
    const kind = p[2], owner = p[3];
    if (interaction.user.id !== owner) { await interaction.reply({ content: "Este painel pertence a outra pessoa. Use /jogo para abrir o seu.", ephemeral: true }); return true; }
    if (!GAMES[kind]) { await interaction.reply({ content: "Jogo não encontrado.", ephemeral: true }); return true; }
    if (action === "multi") {
      const room = { code: code(), kind, hostId: owner, players: new Map([[owner, { id: owner, name: interaction.user.globalName || interaction.user.username }]]), repository };
      rooms.set(room.code, room); room.message = await interaction.channel.send(lobby(room));
      await interaction.update({ content: "Sala **" + room.code + "** criada! Compartilhe com os jogadores para entrarem.", embeds: [], components: [] });
      return true;
    }
    const player = await repository.getPlayer("discord:" + owner);
    const session = { id: code(), kind, mode: "solo", hostId: owner, players: new Map([[owner, { id: owner, name: player?.name || interaction.user.globalName || interaction.user.username }]]), score: new Map([[owner, 0]]), correct: new Map([[owner, 0]]), answers: new Map(), repository, round: 1, status: "playing" };
    sessions.set(session.id, session); session.question = question(kind, 1, Date.now() % 100000);
    await interaction.update({ embeds: [new EmbedBuilder().setColor(0xE89BB5).setTitle("Preparando seu desafio...")], components: [] });
    session.message = await interaction.fetchReply(); await render(session); return true;
  }
  if (["join", "start", "cancel"].includes(action)) {
    const room = rooms.get(p[2]);
    if (!room) { await interaction.reply({ content: "Essa sala não existe mais.", ephemeral: true }); return true; }
    if (action === "join") {
      if (room.players.has(interaction.user.id)) { await interaction.reply({ content: "Você já está na sala.", ephemeral: true }); return true; }
      room.players.set(interaction.user.id, { id: interaction.user.id, name: interaction.user.globalName || interaction.user.username });
      await interaction.update(lobby(room)); return true;
    }
    if (interaction.user.id !== room.hostId) { await interaction.reply({ content: "Somente o anfitrião pode iniciar ou cancelar.", ephemeral: true }); return true; }
    if (action === "cancel") { rooms.delete(room.code); await interaction.update({ content: "Sala cancelada.", embeds: [], components: [] }); return true; }
    if (room.players.size < 2) { await interaction.reply({ content: "São necessários pelo menos 2 participantes.", ephemeral: true }); return true; }
    const session = { id: room.code, roomCode: room.code, kind: room.kind, mode: "multi", hostId: room.hostId, players: room.players, score: new Map([...room.players.keys()].map(x => [x, 0])), correct: new Map([...room.players.keys()].map(x => [x, 0])), answers: new Map(), repository: room.repository, message: room.message, round: 1, status: "playing" };
    sessions.set(session.id, session); session.question = question(session.kind, 1, Date.now() % 100000);
    await interaction.deferUpdate(); await render(session); return true;
  }
  if (action === "answer") {
    const session = sessions.get(p[2]), round = Number(p[3]), choice = Number(p[4]);
    if (!session || session.status !== "playing" || session.round !== round) { await interaction.reply({ content: "Essa rodada já terminou.", ephemeral: true }); return true; }
    if (!session.players.has(interaction.user.id)) { await interaction.reply({ content: "Você não participa desta partida.", ephemeral: true }); return true; }
    if (session.answers.has(interaction.user.id)) { await interaction.reply({ content: "Sua resposta já foi registrada.", ephemeral: true }); return true; }
    const correct = choice === session.question.answer; session.answers.set(interaction.user.id, choice);
    await interaction.reply({ content: correct ? "🎉 Você acertou! A Momoka está orgulhosa! +" + (10 + round * 2) + " pontos." : "🌸 Boa tentativa! " + session.question.explanation + " Você não perde pontos.", ephemeral: true });
    if (session.mode === "solo") await soloResult(session, correct);
    else if (session.answers.size >= session.players.size) await multiplayerResult(session);
    return true;
  }
  if (action === "next") {
    const session = sessions.get(p[2]);
    if (!session || session.hostId !== interaction.user.id || session.status !== "between") { await interaction.reply({ content: "Esta rodada não está disponível.", ephemeral: true }); return true; }
    await interaction.deferUpdate();
    if (session.round >= TOTAL_ROUNDS) await end(session);
    else { session.round++; session.question = question(session.kind, session.round, Date.now() % 100000); await render(session); }
    return true;
  }
  if (action === "rank") {
    const owner = p[3];
    if (interaction.user.id !== owner) { await interaction.reply({ content: "Este painel pertence a outra pessoa. Use /jogo.", ephemeral: true }); return true; }
    if (p[2] === "choose") {
      const rows = Object.entries(GAMES).map(([key, game]) => new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("games:rank:" + key + ":" + owner).setLabel(game.emoji + " " + game.name).setStyle(ButtonStyle.Primary)));
      rows.push(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("games:rank:all:" + owner).setLabel("🏆 Ranking geral").setStyle(ButtonStyle.Secondary)));
      await interaction.update({ embeds: [new EmbedBuilder().setColor(0xE89BB5).setTitle("Rankings por jogo").setDescription("Escolha uma classificação.")], components: rows }); return true;
    }
    await ranking(interaction, repository, p[2]); return true;
  }
  return false;
}
