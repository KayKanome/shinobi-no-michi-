import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { recordCommunityGame } from "./community.js";

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
  ["MOKUTON", "JIGEN", "KAGUYA", "KARMA", "JOGAN"],
  ["INFINITE TSUKUYOMI", "OTSUTSUKI", "IZANAMI", "SHINJUTSU", "KAMA"],
  ["SHIBAI", "DAIKOKUTEN", "LIMBO", "YOMOTSU HIRASAKA", "KOKUO"],
  ["KAGUTSUCHI", "KIRIN", "SAGE OF SIX PATHS", "ASHURA", "INDRA"]
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
  ["Qual é o nome do poder ocular de Kaguya?", ["Rinnegan", "Byakugan", "Sharingan", "Rinne Sharingan"], 3],
  ["Qual é o nome do sapo invocado por Naruto?",["Gamabunta","Manda","Katsuyu","Enma"],0],
  ["Quem é o sensei do Time 10?",["Kakashi","Asuma","Kurenai","Guy"],1],
  ["Qual é a especialidade do clã Nara?",["Insetos","Expansão corporal","Manipulação das sombras","Marionetes"],2],
  ["Qual é a vila natal de Gaara?",["Konoha","Suna","Kiri","Kumo"],1],
  ["Quem ensinou o Rasengan a Naruto?",["Jiraiya","Kakashi","Iruka","Yamato"],0],
  ["Qual é o nome da espada de Kisame?",["Kusanagi","Samehada","Kubikiribocho","Hiramekarei"],1],
  ["Quem é a jinchūriki de Shukaku no início da história?",["Yugito","Gaara","Roshi","Killer B"],1],
  ["Qual é o nome da equipe de Might Guy?",["Time 7","Time 8","Time 9","Time 10"],2],
  ["Qual é a técnica característica de Shino?",["Controle de insetos","Byakugan","Areia de ferro","Possessão das sombras"],0],
  ["Quem é o irmão mais novo de Itachi?",["Shisui","Sasuke","Madara","Obito"],1],
  ["Qual é o nome da invocação de Tsunade?",["Manda","Gamabunta","Katsuyu","Pakkun"],2],
  ["Qual é a natureza de chakra principal de Kakashi?",["Fogo","Relâmpago","Terra","Água"],1],
  ["Quem foi o primeiro jinchūriki de Kurama mostrado na história?",["Kushina","Mito Uzumaki","Naruto","Fugaku"],1],
  ["Qual é o nome do pai de Kakashi?",["Sakumo Hatake","Dan Kato","Hiashi Hyuga","Shikaku Nara"],0],
  ["Quem criou o Rasenshuriken?",["Minato","Jiraiya","Naruto","Kakashi"],2],
  ["Qual membro da Akatsuki usa explosões com argila?",["Sasori","Deidara","Kakuzu","Hidan"],1],
  ["Qual é o nome da espada usada por Zabuza?",["Samehada","Kusanagi","Kubikiribocho","Nuibari"],2],
  ["Quem é a parceira de Konan na Akatsuki?",["Sasori","Pain","Itachi","Deidara"],1],
  ["Qual clã usa técnicas de expansão corporal?",["Akimichi","Yamanaka","Nara","Inuzuka"],0],
  ["Qual é o nome do cão ninja de Kakashi?",["Akamaru","Pakkun","Kiba","Bull"],1],
  ["Quem foi o Segundo Hokage?",["Hashirama","Tobirama","Hiruzen","Minato"],1],
  ["Qual é a kekkei genkai de Haku?",["Liberação de Lava","Liberação de Gelo","Liberação de Madeira","Liberação de Magnetismo"],1],
  ["Quem treinou Sakura durante o salto temporal?",["Kurenai","Tsunade","Anko","Temari"],1],
  ["Qual é o nome da besta de oito caudas?",["Gyuki","Kurama","Shukaku","Son Goku"],0],
  ["Quem é o jinchūriki de Gyuki?",["Gaara","Killer B","Yugito","Roshi"],1],
  ["Qual técnica permite trocar de lugar instantaneamente?",["Hiraishin","Kawarimi","Shunshin","Kage Bunshin"],0],
  ["Quem matou Asuma?",["Kakuzu","Hidan","Deidara","Sasori"],1],
  ["Qual é a habilidade especial do clã Yamanaka?",["Controle mental","Manipular sombras","Invocar cães","Absorver chakra"],0],
  ["Qual é o nome da mãe de Naruto?",["Mikoto","Kushina","Mito","Tsunade"],1],
  ["Quem foi o mentor de Nagato, Yahiko e Konan?",["Orochimaru","Jiraiya","Hiruzen","Danzo"],1],
  ["Qual é o nome do sapo mensageiro de Jiraiya?",["Fukasaku","Gamakichi","Gerotora","Gamariki"],2],
  ["Qual técnica de Itachi cria uma ilusão com corvos?",["Tsukuyomi","Izanagi","Kotoamatsukami","Amaterasu"],0],
  ["Qual é o nome do clã de Kiba?",["Aburame","Inuzuka","Akimichi","Sarutobi"],1],
  ["Quem é o criador do Time 7 original?",["Hiruzen","Kakashi","Minato","Iruka"],2],
  ["Qual é o nome da mãe de Gaara?",["Karura","Mebuki","Mikoto","Kurenai"],0],
  ["Qual membro da Akatsuki tem corpo de marionete?",["Deidara","Sasori","Kisame","Kakuzu"],1],
  ["Qual é a habilidade de Kimimaro?",["Manipular ossos","Controlar areia","Copiar técnicas","Controlar insetos"],0],
  ["Qual é o nome do sapo sábio que treina Naruto?",["Gamabunta","Fukasaku","Gamakichi","Shima"],1],
  ["Quem é o líder do clã Hyuga durante a maior parte da série clássica?",["Neji","Hiashi","Hizashi","Hanabi"],1],
  ["Qual é a natureza de chakra associada ao Rasengan original?",["Vento","Nenhuma natureza adicionada","Fogo","Relâmpago"],1]
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
  ["Sou integrante do clã Otsutsuki e mãe do chakra.", ["Kaguya", "Hinata", "Sakura", "Karin"], 0],
  ["Sou o irmão de Gaara e uso marionetes.",["Kankuro","Temari","Baki","Sasori"],0],
  ["Sou a irmã mais velha de Gaara e luto com um leque.",["Temari","Kurenai","Konan","Tenten"],0],
  ["Sou o parceiro canino de Kiba.",["Pakkun","Akamaru","Bull","Shiba"],1],
  ["Sou o líder do Time 8 e especialista em genjutsu.",["Anko","Kurenai","Tsunade","Shizune"],1],
  ["Sou o sensei do Time 10 e uso técnicas de fogo.",["Asuma","Guy","Kakashi","Yamato"],0],
  ["Sou o sensei do Time 7 durante a missão da Ponte Tenchi.",["Yamato","Iruka","Ebisu","Genma"],0],
  ["Sou um dos Sete Espadachins da Névoa e uso Samehada.",["Zabuza","Kisame","Suigetsu","Chojuro"],1],
  ["Sou conhecido como o Eremita dos Seis Caminhos.",["Hagoromo","Hamura","Indra","Ashura"],0],
  ["Sou o filho mais velho de Hagoromo.",["Ashura","Indra","Toneri","Kaguya"],1],
  ["Sou o filho mais novo de Hagoromo.",["Ashura","Indra","Toneri","Madara"],0],
  ["Sou o irmão de Hashirama e Segundo Hokage.",["Tobirama","Kawarama","Itama","Hiruzen"],0],
  ["Sou o Terceiro Hokage.",["Hiruzen","Minato","Tobirama","Danzo"],0],
  ["Sou conhecido como Sábio Tarado e mestre de Naruto.",["Jiraiya","Orochimaru","Tsunade","Hiruzen"],0],
  ["Sou uma das lendárias Sannin e Quinta Hokage.",["Shizune","Tsunade","Kurenai","Mei"],1],
  ["Sou o Sannin que pesquisa técnicas proibidas e cobiça corpos.",["Orochimaru","Kabuto","Danzo","Sasori"],0],
  ["Sou o médico ninja que serviu Orochimaru e depois ajudou Konoha.",["Kabuto","Kimimaro","Suigetsu","Jugo"],0],
  ["Sou a amiga de infância de Naruto que usa Byakugan.",["Sakura","Hinata","Ino","Tenten"],1],
  ["Sou a kunoichi do Time 10 apaixonada por flores.",["Ino","Sakura","Temari","Hinata"],0],
  ["Sou o usuário de marionetes que enfrentou Sakura e Chiyo.",["Sasori","Kankuro","Deidara","Chiyo"],0],
  ["Sou a avó de Sasori e uma mestre das marionetes.",["Chiyo","Kushina","Mito","Karura"],0],
  ["Sou o jinchūriki de Matatabi.",["Yugito Nii","Roshi","Han","Utakata"],0],
  ["Sou o jinchūriki de Son Goku.",["Roshi","Killer B","Yagura","Gaara"],0],
  ["Sou o jinchūriki de Saiken.",["Utakata","Han","Yugito","Fu"],0],
  ["Sou a jinchūriki de Chomei.",["Fu","Yugito","Kushina","Mito"],0],
  ["Sou o Quarto Mizukage e jinchūriki de Isobu.",["Yagura","Mei","Ao","Chojuro"],0],
  ["Sou o Segundo Tsuchikage e mestre da desintegração.",["Mu","Onoki","Kitsuchi","Deidara"],0],
  ["Sou o Terceiro Raikage e pai de A.",["A","Darui","Killer B","C"],0],
  ["Sou um ninja da Raiz de Danzo e uso insetos venenosos.",["Yamato","Sai","Fū","Torune"],3],
  ["Sou o artista da tinta que entrou no Time 7.",["Sai","Yamato","Shino","Kiba"],0],
  ["Sou o irmão de Sai, lembrado em sua infância.",["Shin","Dan","Shisui","Sasuke"],0],
  ["Sou o Uchiha que deu seu Sharingan a Kakashi.",["Obito","Shisui","Itachi","Madara"],0],
  ["Sou o Uchiha conhecido por sua velocidade e amigo de Itachi.",["Shisui","Obito","Fugaku","Izuna"],0],
  ["Sou o pai de Sasuke e líder do clã Uchiha.",["Fugaku","Mikoto","Madara","Izuna"],0],
  ["Sou a mãe de Sasuke e Itachi.",["Mikoto","Kushina","Karin","Kaguya"],0],
  ["Sou o fundador da Vila da Areia e usuário de marionetes.",["Terceiro Kazekage","Quarto Kazekage","Rasa","Gaara"],0],
  ["Sou o Quarto Kazekage e pai de Gaara.",["Rasa","Yashamaru","Baki","Kankuro"],0],
  ["Sou o ninja que cuidou de Gaara na infância e era seu tio.",["Yashamaru","Baki","Rasa","Kankuro"],0],
  ["Sou o espadachim da Névoa que lutou contra Kakashi na Ponte.",["Zabuza","Kisame","Chojuro","Mangetsu"],0],
  ["Sou o irmão de Suigetsu e também espadachim da Névoa.",["Mangetsu","Kisame","Zabuza","Juzo"],0],
  ["Sou a líder da Vila da Névoa durante a Quarta Guerra.",["Mei Terumi","Tsunade","Chiyo","Konan"],0]
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
function question(kind, round, seed, used = new Set()) {
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
    const bank = kind === "quiz" ? QUIZ : WHO;
    const tier = Math.floor((round - 1) / 2);
    const start = tier * 10;
    const available = Array.from({ length: 10 }, (_, i) => start + i).filter(i => !used.has(kind + ":" + i));
    const index = available.length ? available[Math.abs(seed) % available.length] : start + (round % 10);
    used.add(kind + ":" + index);
    const item = bank[index];
    return { title: GAMES[kind].emoji + " " + GAMES[kind].name, prompt: "**Nível " + round + "/10**\n" + item[0], choices: item[1], answer: item[2], explanation: "Resposta: **" + item[1][item[2]] + "**." };
  }
  const a = 1 + ((seed * 3 + round * 2) % (round + 5));
  const b = 1 + ((seed * 7 + round * 3) % (round + 5));
  const sum = a + b;
  const choices = shuffle([sum, sum + 1, Math.max(2, sum - 2), sum + 3], seed + round).map(String);
  return { title: "🎲 Desafio dos dados", prompt: "**Nível " + round + "/10**\nQual é a soma dos dois dados?\n\n# 🎲 " + a + " + " + b + " = ?", choices, answer: choices.indexOf(String(sum)), explanation: "A soma correta é **" + sum + "**." };
}
function code() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }
function editSession(session, payload) { return session.mode === "solo" ? session.edit(payload) : session.message.edit(payload); }
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
    .setDescription("**Convite de partida multiplayer**\nJogo: " + GAMES[room.kind].name + "\nCódigo: `" + room.code + "`\nAnfitrião: <@" + room.hostId + ">\n\n**Participantes (" + room.players.size + ")**\n" + names + "\n\nMínimo: 2 jogadores. O anfitrião inicia quando todos estiverem prontos.")
    .setFooter({ text: "Convite de jogo • Shinobi no Michi" });
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
  await editSession(session, { embeds: [embed], components: buttons(session) });
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
  const previousBest = Number(s.bestGamePoints || 0);
  const isNewRecord = points > previousBest;
  if (isNewRecord) s.bestGamePoints = points;
  if (!s.achievements.includes("Primeira Partida")) s.achievements.push("Primeira Partida");
  if (s.totalPoints >= 100 && !s.achievements.includes("Espírito Competitivo")) s.achievements.push("Espírito Competitivo");
  if (s.byGame[kind].correct >= 10 && !s.achievements.includes("Mestre " + GAMES[kind].name)) s.achievements.push("Mestre " + GAMES[kind].name);
  player.gameStats = s;
  await repository.savePlayer(player);
  return { isNewRecord, previousBest, points, name: player.name || "Shinobi" };
}
async function end(session) {
  clearTimeout(session.timer); session.status = "finished";
  const result = [];
  for (const p of session.players.values()) {
    const points = session.score.get(p.id) || 0;
    const saved = await saveScore(session.repository, p.id, session.kind, points, session.correct.get(p.id) || 0);
    await recordCommunityGame(session.client, session.repository, session.guildId, p.id, points).catch(error => console.error("Falha ao registrar pontos da missão:", error.message));
    if (saved?.isNewRecord && session.guildId && session.client) {
      try {
        const muralId = await session.repository.getMuralChannel(session.guildId);
        const mural = muralId ? await session.client.channels.fetch(muralId).catch(() => null) : null;
        if (mural?.isTextBased?.()) {
          await mural.send({
            content: `🏅 **NOVO RECORDE PESSOAL!**\nParabéns, <@${p.id}>! Você marcou **${points} pontos** em uma única partida e superou seu recorde anterior de **${saved.previousBest} pontos**! 🌸`,
            allowedMentions: { users: [p.id] }
          });
        }
      } catch (error) {
        console.error("Não foi possível publicar o recorde no Mural da Vila:", error.message);
      }
    }
    result.push({ name: p.name, points });
  }
  result.sort((a, b) => b.points - a.points);
  const lines = result.map((p, i) => (i + 1) + ". **" + p.name + "** — " + p.points + " pts").join("\n");
  const embed = new EmbedBuilder().setColor(0xE89BB5).setTitle("🏆 Partida concluída!")
    .setDescription(lines + "\n\nResultado salvo no ranking! Medalhas e títulos são registrados no perfil. Ryō não é perdido por errar.");
  await editSession(session, { embeds: [embed], components: [] });
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
  await editSession(session, { embeds: [embed], components: [new ActionRowBuilder().addComponents(
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
    session.round++; session.question = question(session.kind, session.round, Date.now() % 100000, session.questionUsed);
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
  const embed = new EmbedBuilder().setColor(0xE89BB5).setTitle(title).setDescription(desc);
  if (interaction.isMessageComponent()) return interaction.followUp({ embeds: [embed], ephemeral: false });
  return interaction.editReply({ embeds: [embed], components: [] });
}
export async function handleGamesCommand(interaction, repository) {
  if (interaction.commandName === "jogo") return interaction.reply({ ...modePanel(interaction.user.id), ephemeral: true });
  await interaction.deferReply();
  return ranking(interaction, repository, "all");
}
export async function handleGamesInteraction(interaction, repository) {
  if (!interaction.customId?.startsWith("games:")) return false;
  const p = interaction.customId.split(":"); const action = p[1];
  if (action === "solo" || action === "multi") {
    const kind = p[2], owner = p[3];
    if (interaction.user.id !== owner) { await interaction.reply({ content: "Este painel pertence a outra pessoa. Use /jogo para abrir o seu.", ephemeral: true }); return true; }
    if (!GAMES[kind]) { await interaction.reply({ content: "Jogo não encontrado.", ephemeral: true }); return true; }
    if (action === "multi") {
      const room = { code: code(), kind, hostId: owner, guildId: interaction.guildId, client: interaction.client, players: new Map([[owner, { id: owner, name: interaction.user.globalName || interaction.user.username }]]), repository };
      rooms.set(room.code, room);
      await interaction.deferUpdate();
      room.message = await interaction.channel.send(lobby(room));
      await interaction.editReply({ content: "🌸 Sala **" + room.code + "** criada! O convite separado foi enviado no canal.", embeds: [], components: [] });
      return true;
    }
    await interaction.deferUpdate();
    const player = await repository.getPlayer("discord:" + owner);
    const session = { id: code(), kind, mode: "solo", hostId: owner, guildId: interaction.guildId, client: interaction.client, players: new Map([[owner, { id: owner, name: player?.name || interaction.user.globalName || interaction.user.username }]]), score: new Map([[owner, 0]]), correct: new Map([[owner, 0]]), answers: new Map(), repository, round: 1, status: "playing" };
    session.questionUsed = new Set(); sessions.set(session.id, session); session.question = question(kind, 1, Date.now() % 100000, session.questionUsed);
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xE89BB5).setTitle("Preparando seu desafio...")], components: [] });
    session.edit = payload => interaction.editReply(payload); await render(session); return true;
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
    const session = { id: room.code, roomCode: room.code, kind: room.kind, mode: "multi", guildId: room.guildId, client: room.client, players: room.players, score: new Map([...room.players.keys()].map(x => [x, 0])), correct: new Map([...room.players.keys()].map(x => [x, 0])), answers: new Map(), repository: room.repository, message: room.message, round: 1, status: "playing" };
    session.questionUsed = new Set(); sessions.set(session.id, session); session.question = question(session.kind, 1, Date.now() % 100000, session.questionUsed);
    await interaction.deferUpdate(); await render(session); return true;
  }
  if (action === "answer") {
    const session = sessions.get(p[2]), round = Number(p[3]), choice = Number(p[4]);
    if (!session || session.status !== "playing" || session.round !== round) { await interaction.reply({ content: "Essa rodada já terminou.", ephemeral: true }); return true; }
    if (!session.players.has(interaction.user.id)) { await interaction.reply({ content: "Você não participa desta partida.", ephemeral: true }); return true; }
    if (session.answers.has(interaction.user.id)) { await interaction.reply({ content: "Sua resposta já foi registrada.", ephemeral: true }); return true; }
    const correct = choice === session.question.answer; session.answers.set(interaction.user.id, choice);
    // Confirma o clique sem criar uma nova mensagem privada a cada resposta.
    await interaction.deferUpdate();
    if (session.mode === "solo") await soloResult(session, correct);
    else if (session.answers.size >= session.players.size) await multiplayerResult(session);
    return true;
  }
  if (action === "next") {
    const session = sessions.get(p[2]);
    if (!session || session.hostId !== interaction.user.id || session.status !== "between") { await interaction.reply({ content: "Esta rodada não está disponível.", ephemeral: true }); return true; }
    await interaction.deferUpdate();
    if (session.round >= TOTAL_ROUNDS) await end(session);
    else { session.round++; session.question = question(session.kind, session.round, Date.now() % 100000, session.questionUsed); await render(session); }
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
    await interaction.deferUpdate(); await ranking(interaction, repository, p[2]); return true;
  }
  return false;
}
