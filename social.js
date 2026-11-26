import { randomUUID } from "node:crypto";
import { setupMomokaChat } from "./momoka-ai.js";
import { familyCommands, handleFamilyCommand } from "./family.js";
import { renderFamilyTree } from "./family-tree.js";
import { buildGamesPanel, gameSlashCommands, handleGamesCommand, handleGamesInteraction } from "./games.js";
import { communitySlashCommands, handleCommunityCommand, startCommunityAutomation } from "./community.js";
import { newspaperSlashCommands, handleNewspaperCommand, recordNewspaperMoment, startNewspaperWeekly } from "./newspaper.js";

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  UserSelectMenuBuilder,
  AttachmentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  PermissionFlagsBits,
  ChannelType
} from "discord.js";

export const SOCIAL_ACTIONS = {
  hug: { label: "Abraçar", verb: "deu um abraço em" },
  pat: { label: "Fazer carinho", verb: "fez carinho na cabeça de" },
  wave: { label: "Cumprimentar", verb: "acenou para" },
  facepalm: { label: "Face Palm", verb: "fez um facepalm por causa de" },
  attack: { label: "Atacar", verb: "lançou um ataque contra" }
};

const SOCIAL_GIFS = {
  hug: [
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575320797848010873/icon-goal-xd.webp?ex=6b08db52&is=6b0789d2&hm=f07904f28608bcda7a2e6e8870967dc38431d163d6dad94054621c78666ba8f5&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575320798137155655/hug-anime.webp?ex=6b08db52&is=6b0789d2&hm=88e20bf55d7a47c66748ea8e1f3098bfa208efa80d38662bb910a0b9b3721415&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575320798439153724/hug-big-hug.webp?ex=6b08db52&is=6b0789d2&hm=9f66c29b9a281918136a7cd788f479215295c13c1601d7fb506c791493b39a0e&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575320798854385695/hug-k-on.webp?ex=6b08db52&is=6b0789d2&hm=5c02e7d6645948912b421b2d86df2b10503d51dda6a67b63c48c6dff6a71ab2f&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575320799173414983/yukon-child-form-embracing-ulquiorra.webp?ex=6b08db52&is=6b0789d2&hm=01b2b467a9e8df76ad22b5968f801089a0e2eaf0b153b88b2bd097164ffadf84&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575320799450112110/pjsk-airi.webp?ex=6b08db52&is=6b0789d2&hm=2998103459a29eadf6e25afc4a067e9672ab916d5441aa44a94222d3643850e2&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575320799773065216/anime-comfort-hug-anime-hug.webp?ex=6b08db52&is=6b0789d2&hm=5bf45062a0ecda55a07f361897d47a3c9bff871b32aae8339edb302fba87d756&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575320800154619924/hugs-cute-hugs-gif.webp?ex=6b08db52&is=6b0789d2&hm=1b5f9a08c26d84c6e665857f88c8b00d0a1bca8cef9bb16bd60494c29c31bbe7&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575320800465256578/anime-hug.webp?ex=6b08db52&is=6b0789d2&hm=7c61600cedd011e1cf266723aaa59a968ea46addf596bece91793d9d7d3b2fdb&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575320800783900752/hug-anime.gif?ex=6b08db52&is=6b0789d2&hm=d3a2217b7d984a37b41c4bc68cbd8c40df292827b6bd7bfbbe42db0b0329a5ac&"
  ],
  pat: [
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575323045436858480/raphtalia-pat.webp?ex=6b08dd6a&is=6b078bea&hm=b270f8e3d85ec6b24ab3cb580cc6cadb81323fbb4609d406aaa45c3642a8b266&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575323045868994661/anime-good-girl.webp?ex=6b08dd6a&is=6b078bea&hm=295559f3fd90ac91aa67c6aa409d66567678422a877182674f1556e295900101&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575323046212796507/hlop.webp?ex=6b08dd6a&is=6b078bea&hm=ffb2fb1f6af4cef9d23c823c30e100f6c30e85ef4c5609668badd9b18e4fdd5d&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575323046523310180/pat-anime.webp?ex=6b08dd6a&is=6b078bea&hm=7064352fb0a4c6c189522348d40de2b2a4e685717b00439fd89f15ce3ac36ad7&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575323047194267728/pat-pat.webp?ex=6b08dd6a&is=6b078bea&hm=e03b900dd506748872794a7c62a8ad65cd38883357d72b4047c2fab1b3551a32&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575323047517224990/aharen-san-wa-hakarenai-aharen-is-indecipherable.webp?ex=6b08dd6a&is=6b078bea&hm=16aa0a037cef1ce3e0b32672cd6dfbd226c149cc36d836ef5431cdd4a7590099&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575323047857225788/anime.webp?ex=6b08dd6a&is=6b078bea&hm=bfbbc66444ea0f50f4129d61fd8baed0884f7082c52915d5353797b71f465d41&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575323048163414237/hugtrip.webp?ex=6b08dd6a&is=6b078bea&hm=2397bab810cc79d0c637da3a38671ed7a265236a3c2ca9c303440964bc1d8513&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575323048498700388/ao-haru-ride-anime-boy.webp?ex=6b08dd6a&is=6b078bea&hm=7f19044d61ca45193a2179d9d7eb9dd4ed078d919b2b7fd38642d31b0a81506c&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575323776038473738/head-pat-anime-anime-girl-blush.webp?ex=6b08de18&is=6b078c98&hm=eb7467bfe0bcc0f2ff065655e4469873068c371cfa2cb4c2ea7871d554074236&"
  ],
  wave: [
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575325360596320446/my-man-anime.webp?ex=6b08df92&is=6b078e12&hm=d461dba98e135ece4c0689f141db8d4ae39c406cd46adb53c9bd623f2f96b244&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575325360873279559/hello-azumanga.webp?ex=6b08df92&is=6b078e12&hm=c469b39437c24893fd1a1b5df8f2b5050575dc8c322877a63b136f4da020af13&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575325361124806776/sailor-moon-rei.webp?ex=6b08df92&is=6b078e12&hm=732cf4fa0a6353ea96d781cd2ea172854bfce3558fc81b5df983ecfa6e8f9bd7&",
    "https://c.tenor.com/Ch4VFEjuI7IAAAAC/anime-boy.gif",
    "https://media4.giphy.com/media/v1.Y2lkPTZjMDliOTUyZjNsazlldGw1MWVwYnF2a3AwbGtuZzh3OHdzOXprMW0yY2pjNmFncSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/JmHlOSGpcuBBL74yjc/giphy.gif"
  ],
  facepalm: [
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575328635080941629/zukkan-the-ones-within.webp?ex=6b08e29e&is=6b07911e&hm=ef4c4f1d98dddca4f3b997cca6a276083e947cb2499278777cf5f02943e9ec90&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575328635374538752/kuroko-anime.webp?ex=6b08e29e&is=6b07911e&hm=ba160895477529174f38edcdcf79f31e1fcdfb61ad3c5ca33727400e89e9d808&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575328635697758418/case-study-of-vanitas-vanitas-no-carte.webp?ex=6b08e29e&is=6b07911e&hm=27268dd8a21114c055bc0f4c3680031920060b9094328bd886197eccc56f59ba&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575328636008013824/higuruma-hiromi-higuruma.webp?ex=6b08e29f&is=6b07911f&hm=64cd0014e811f6ac09635aa7231e7d04302aadfc4c03622d8079b01f21eed6ff&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575328636544753816/facepalm-anime.webp?ex=6b08e29f&is=6b07911f&hm=6626b086af6103f86f900986a4acc1347d039845950a42c3cb0546ab388a229e&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575328636968370206/facepalm-obonai-obonai-facepalm.webp?ex=6b08e29f&is=6b07911f&hm=fd69ce837933c924896cae43cbb6e709103e86a5d5ad6767c6041686a794137d&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575328637308371004/mermaid-melody-rina.webp?ex=6b08e29f&is=6b07911f&hm=049fa090429c40f9ceae08842302628597599fbaa15dd2a1349af1dae47f3615&"
  ],
  attack: [
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575330400052715620/anime-purple.webp?ex=6b08e443&is=6b0792c3&hm=59bec58a738c2b3df258ce65a56386cbe095c9f8d1ea4d2b74836a1b35f56e72&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575330400509886614/bleach-anime.webp?ex=6b08e443&is=6b0792c3&hm=03ec13bba45c07a2c63494432393a1e4dd1bf670c260c77010282031c9b745af&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575330401138774033/anime-fight.webp?ex=6b08e443&is=6b0792c3&hm=1fb7198399203823addabfa26eeb41a229cf641d2ff1d77d9c7d27027c2b638b&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575330401587691763/anime-sword-art-online.webp?ex=6b08e443&is=6b0792c3&hm=a39d3bd662989042c24f9c9f6904c3fbdfbfaa2eb9e3cc44b63a5e10dfefeed2&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575330401990221904/magia-de-fuego-anime-ataque-de-fuego.webp?ex=6b08e444&is=6b0792c4&hm=c167474824e38ffc80793b32a0705cab782cd3ed9e9d3ff7179fb40153f26eea&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575330402326020157/kagura-fairy-tail.webp?ex=6b08e444&is=6b0792c4&hm=a11c36c05c531726d551f10b84d538723440c296a4afcd2690126c6cf66a694e&",
    "https://cdn.discordapp.com/attachments/1440733156008399080/1575330402720022578/kirima-nagi-kick.webp?ex=6b08e444&is=6b0792c4&hm=16a37a4ca12307e1f5fbe6a3cf0965c1402cd72b61e57faaa02aa94ed3d39360&"
  ]
};

const SOCIAL_COMMANDS = {
  abracar: "hug",
  carinho: "pat",
  cumprimentar: "wave",
  facepalm: "facepalm",
  atacar: "attack"
};

export function formatSocialAction(actorName, targetName, action) {
  const config = SOCIAL_ACTIONS[action];
  if (!config) throw new Error("Interação social desconhecida.");
  return actorName + " " + config.verb + " " + targetName;
}

export function isSocialPanelOwner(customId, userId) {
  const ownerId = String(customId || "").split(":").at(-1);
  return Boolean(ownerId && ownerId === String(userId));
}

const SHIP_TYPES = [
  { min: 1, max: 12, label: "Inimigos jurados", emoji: "🌑", color: 0x80536B, description: "Os registros apontam uma relação marcada por desconfiança e conflitos. É melhor manter os olhos abertos." },
  { min: 13, max: 25, label: "Rivais declarados", emoji: "⚔️", color: 0xE6A23C, description: "Competição acirrada e uma vontade constante de provar quem é o melhor. Nenhum dos dois costuma recuar." },
  { min: 26, max: 38, label: "Caos em dobro", emoji: "🎭", color: 0xA58AD2, description: "Quando estão juntos, a tranquilidade vai embora. Imprevisíveis, barulhentos e difíceis de esquecer." },
  { min: 39, max: 51, label: "Parceiros de missão", emoji: "🥷", color: 0x6798C9, description: "Uma parceria promissora, com espaço para confiança, estratégia e grandes missões lado a lado." },
  { min: 52, max: 64, label: "Amizade lendária", emoji: "🤝", color: 0x62B6A5, description: "Um laço de companheirismo que pode resistir a desafios e render histórias memoráveis." },
  { min: 65, max: 77, label: "Afinidade especial", emoji: "🌸", color: 0xD98BB8, description: "Há uma sintonia marcante entre os dois, com compreensão e proximidade que chamam a atenção." },
  { min: 78, max: 89, label: "Ship de novela", emoji: "💞", color: 0xE879A8, description: "Uma conexão cheia de emoção e reviravoltas. A vila certamente teria muito o que comentar!" },
  { min: 90, max: 100, label: "Amor destinado", emoji: "❤️", color: 0xD94F78, description: "Um laço extraordinário, digno de uma história marcante. A Momoka encontrou uma conexão no nível máximo." }
];

function stableHash(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function calculateShipResult(firstId, secondId) {
  if (!firstId || !secondId || String(firstId) === String(secondId)) {
    throw new Error("Escolha duas pessoas diferentes para analisar o ship.");
  }
  const pair = [String(firstId), String(secondId)].sort().join(":");
  const percentage = (stableHash(pair + "|momoka-score") % 100) + 1;
  const type = SHIP_TYPES.find(item => percentage >= item.min && percentage <= item.max);
  return { percentage, ...type };
}

export function buildShipEmbed(first, second) {
  const result = calculateShipResult(first.id, second.id);
  const firstName = first.globalName || first.username;
  const secondName = second.globalName || second.username;
  const filled = Math.round(result.percentage / 10);
  const meter = "🩷".repeat(filled) + "🤍".repeat(10 - filled);
  return new EmbedBuilder()
    .setColor(result.color)
    .setTitle("💞 Laços do Destino")
    .setDescription("A Momoka consultou os arquivos secretos da vila e analisou a energia desta dupla...")
    .setAuthor({ name: firstName, iconURL: first.displayAvatarURL({ extension: "png", size: 128 }) })
    .setThumbnail(second.displayAvatarURL({ extension: "png", size: 256 }))
    .addFields(
      { name: "🌸 Dupla analisada", value: "**" + firstName + "**  ×  **" + secondName + "**" },
      { name: "💗 Intensidade do laço", value: "**" + result.percentage + "%**\n" + meter, inline: true },
      { name: "🔮 Veredito da Momoka", value: result.emoji + " **" + result.label + "**\n" + result.description },
    )
    .setFooter({ text: "Shinobi no Michi • Resultado fictício para diversão" })
    .setTimestamp();
}



function mainPanel(ownerId, avatarUrl) {
  const embed = new EmbedBuilder()
    .setColor(0xE89BB5)
    .setTitle("🌸 Cantinho Social da Momoka")
    .setDescription(
      "Seu espaço para interagir, cuidar da família, jogar e participar dos eventos. Este painel é privado e só você pode controlá-lo."
    );

  const rowOne = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("social:cat:interacoes:" + ownerId).setLabel("Interações").setEmoji("🤗").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("social:cat:familia:" + ownerId).setLabel("Família").setEmoji("🌳").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("social:cat:jogos:" + ownerId).setLabel("Jogos").setEmoji("🎮").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("social:cat:eventos:" + ownerId).setLabel("Eventos").setEmoji("🏮").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("social:cat:shipp:" + ownerId).setLabel("Shipp").setEmoji("💘").setStyle(ButtonStyle.Secondary)
  );
  return { embeds: [embed], components: [rowOne] };
}

const SHINOBI_GAMES = {
  quiz: {
    title: "🧠 Quiz Shinobi",
    prompt: "Qual destes NÃO faz parte dos cinco elementos básicos de transformação da natureza?",
    choices: ["Fogo", "Água", "Metal", "Vento"], answer: 2,
    explanation: "Os cinco elementos básicos são Fogo, Vento, Relâmpago, Terra e Água."
  },
  who: {
    title: "🔎 Quem sou eu?",
    prompt: "Sou conhecido como o Ninja Copiador e fiquei famoso pelo Sharingan. Quem sou eu?",
    choices: ["Kakashi Hatake", "Shikamaru Nara", "Might Guy", "Jiraiya"], answer: 0,
    explanation: "É Kakashi Hatake, conhecido como o Ninja Copiador."
  },
  word: {
    title: "📜 Palavra Shinobi",
    prompt: "Desembaralhe as letras: **R A H S I N G A**. Qual palavra aparece?",
    choices: ["Rasengan", "Sharingan", "Hokage", "Chakra"], answer: 1,
    explanation: "SHARINGAN — uma habilidade ocular do clã Uchiha."
  }
};

function gamesPanel(ownerId) {
  const embed = new EmbedBuilder().setColor(0xE89BB5).setTitle("🎮 Jogos Shinobi")
    .setDescription("Escolha uma atividade para jogar! Nesta primeira versão, os jogos são apenas para diversão. Ryō e XP serão conectados quando o sistema de economia e progressão for desenvolvido.");
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("social:game:quiz:" + ownerId).setLabel("Quiz Shinobi").setEmoji("🧠").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("social:game:who:" + ownerId).setLabel("Quem sou eu?").setEmoji("🔎").setStyle(ButtonStyle.Primary)
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("social:game:dice:" + ownerId).setLabel("Desafio dos dados").setEmoji("🎲").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("social:game:word:" + ownerId).setLabel("Palavra Shinobi").setEmoji("📜").setStyle(ButtonStyle.Primary)
  );
  const back = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("social:back:" + ownerId).setLabel("Voltar").setEmoji("⬅️").setStyle(ButtonStyle.Secondary)
  );
  return { embeds: [embed], components: [row1, row2, back] };
}

function questionGame(kind, ownerId) {
  const game = SHINOBI_GAMES[kind];
  const embed = new EmbedBuilder().setColor(0xE89BB5).setTitle(game.title).setDescription(game.prompt);
  const choices = new ActionRowBuilder().addComponents(game.choices.map((choice, index) =>
    new ButtonBuilder().setCustomId("social:gameanswer:" + kind + ":" + index + ":" + ownerId)
      .setLabel(choice).setStyle(ButtonStyle.Secondary)
  ));
  const back = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("social:cat:jogos:" + ownerId).setLabel("Voltar aos jogos").setEmoji("⬅️").setStyle(ButtonStyle.Secondary)
  );
  return { embeds: [embed], components: [choices, back] };
}

function categoryPanel(category, ownerId, avatarUrl) {
  const back = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("social:back:" + ownerId).setLabel("Voltar").setEmoji("⬅️").setStyle(ButtonStyle.Secondary)
  );
  if (category === "interacoes") {
    const embed = new EmbedBuilder()
      .setColor(0xE89BB5)
      .setTitle("🤗 Interações")
      .setDescription("Escolha uma interação e selecione uma pessoa. A publicação no canal mostrará a ação. Os GIFs serão adicionados conforme você enviar.\n\nAtalhos: /abracar, /carinho, /cumprimentar, /facepalm e /atacar.");
    const actions = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("social:act:hug:" + ownerId).setLabel("Abraçar").setEmoji("🫂").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("social:act:pat:" + ownerId).setLabel("Carinho").setEmoji("🐾").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("social:act:wave:" + ownerId).setLabel("Cumprimentar").setEmoji("👋").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("social:act:facepalm:" + ownerId).setLabel("Face Palm").setEmoji("🤦").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("social:act:attack:" + ownerId).setLabel("Atacar").setEmoji("⚔️").setStyle(ButtonStyle.Danger)
    );
    return { embeds: [embed], components: [actions, back] };
  }

  if (category === "familia") {
    const embed=new EmbedBuilder().setColor(0x8DBB83).setTitle("🌳 Família & Laços").setDescription("Construa sua própria história no Shinobi no Michi. A família nasce da adoção, sem limite de filhos e sem exigir casamento.\n\n**Comandos**\n/familia — árvore genealógica\n/adotar jogador — convite de adoção\n/desertar jogador — deserdar um vínculo de adoção\n/casar jogador — pedido de casamento\n/cancelar_casamento pessoa — pedir divórcio\n/papel — escolher Masculino, Feminino ou Prefiro não dizer\n\nOs convites aparecem no canal e só são concluídos com consentimento.");
    const row1=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("social:family:tree:"+ownerId).setLabel("Minha família").setEmoji("🌳").setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId("social:family:adopt:"+ownerId).setLabel("Adotar").setEmoji("🌱").setStyle(ButtonStyle.Primary),new ButtonBuilder().setCustomId("social:family:marry:"+ownerId).setLabel("Casamento").setEmoji("💍").setStyle(ButtonStyle.Primary));
    const row2=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("social:family:unlink:"+ownerId).setLabel("Deserdar").setEmoji("🍃").setStyle(ButtonStyle.Secondary),new ButtonBuilder().setCustomId("social:family:divorce:"+ownerId).setLabel("Divórcio").setEmoji("💔").setStyle(ButtonStyle.Secondary),back.components[0]);
    return {embeds:[embed],components:[row1,row2]};
  }

  if (category === "shipp" || category === "relacionamentos") {
    const embed = new EmbedBuilder()
      .setColor(0xD98BB8)
      .setTitle("💘 Central de Shipp")
      .setThumbnail(avatarUrl)
      .setDescription("Escolha duas pessoas do servidor para descobrir qual combinação fictícia a Momoka encontra entre elas.\n\n**Selecione exatamente dois jogadores abaixo.** O resultado é uma brincadeira do RPG: não representa sentimentos reais nem altera relacionamentos ou fichas.");
    const picker = new UserSelectMenuBuilder()
      .setCustomId("social:shiptarget:" + ownerId)
      .setPlaceholder("Selecione os dois jogadores")
      .setMinValues(2)
      .setMaxValues(2);
    return { embeds: [embed], components: [new ActionRowBuilder().addComponents(picker), back] };
  }

  if (category === "jogos") return buildGamesPanel(ownerId);
  const sections = {
    eventos: ["🏮 Eventos", "Os eventos da comunidade serão desenvolvidos em uma próxima etapa."]
  };
  const section = sections[category] || ["Categoria", "Esta área ainda está sendo preparada."];
  const embed = new EmbedBuilder().setColor(0xE89BB5).setTitle(section[0]).setDescription(section[1]);
  return { embeds: [embed], components: [back] };
}

async function publishAction(channel, actor, target, action, repository) {
  const actorName = actor.globalName || actor.username;
  const targetName = target.globalName || target.username;
  const stories = {
    hug: ["Um abraço inesperado!", actorName + " deu um abraço em " + targetName + "!\n\nÀs vezes, um abraço vale mais que mil palavras. 🌸"],
    pat: ["Um carinho especial!", actorName + " fez carinho na cabeça de " + targetName + ".\n\nPequenos gestos também deixam grandes lembranças. 🌸"],
    wave: ["Um cumprimento pela vila!", actorName + " acenou para " + targetName + ".\n\nUm simples olá pode começar uma boa história! 🌸"],
    facepalm: ["Momento de vergonha alheia!", actorName + " não acreditou no que " + targetName + " acabou de fazer."],
    attack: ["Um desafio inesperado!", actorName + " desafiou " + targetName + " para um confronto!\n\nA vila inteira ficou curiosa para saber quem leva a melhor. ⚔️"]
  };
  const [headline, story] = stories[action] || ["Um momento na vila!", formatSocialAction(actorName, targetName, action)];
  const embed = new EmbedBuilder().setColor(0xE879B5).setTitle(headline)
    .setDescription(story)
    .setImage(SOCIAL_GIFS[action]?.[Math.floor(Math.random() * SOCIAL_GIFS[action].length)] || null)
    .setFooter({ text: "Shinobi no Michi • Momentos da vila" }).setTimestamp();
  await channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
  if (channel.guild?.id) await recordNewspaperMoment(repository, channel.guild.id, {
    category: "Interação social", text: actorName + " e " + targetName + ": " + headline
  });
}

function rpHomePanel(ownerId, characters) {
  const embed = new EmbedBuilder().setColor(0xD98BB8).setTitle("🎭 Central de Personagens").setDescription(characters.length ? "Escolha um personagem para interpretar ou cadastre um novo. Este painel é privado." : "Você ainda não cadastrou personagens. Crie o primeiro para começar a interpretar!");
  if (characters.length) embed.addFields({ name: "Seus personagens", value: characters.map((item, i) => `${i + 1}. **${item.name}**`).join("\n").slice(0, 1000) });
  const rows = [];
  if (characters.length) rows.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`rp:choose:${ownerId}`).setPlaceholder("Selecione seu personagem").setMinValues(1).setMaxValues(1).addOptions(characters.slice(0, 25).map(item => ({ label: item.name.slice(0, 100), value: item.id, description: (item.description || "Personagem de RP").slice(0, 100) })))));
  rows.push(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`rp:create:${ownerId}`).setLabel("Criar personagem").setEmoji("✨").setStyle(ButtonStyle.Success)));
  return { embeds: [embed], components: rows };
}

function rpCharacterPanel(ownerId, character) {
  const embed = new EmbedBuilder().setColor(0xD98BB8).setTitle(`🎭 ${character.name}`).setDescription((character.description || "Sem descrição cadastrada.") + "\n\n**Personagem ativo para RP.** Para interpretar, escreva `RP.` seguido da sua mensagem no canal.").addFields({ name: "Apresentação", value: character.introduction || "Nenhuma apresentação cadastrada." }).setFooter({ text: "Personagem ativo • Painel privado" });
  if (character.imageUrl) embed.setThumbnail(character.imageUrl);
  const manage = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`rp:edit:${character.id}:${ownerId}`).setLabel("Editar").setEmoji("✏️").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`rp:delete:${character.id}:${ownerId}`).setLabel("Excluir").setEmoji("🗑️").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`rp:home:${ownerId}`).setLabel("Trocar personagem").setEmoji("🔄").setStyle(ButtonStyle.Secondary));
  return { embeds: [embed], components: [manage] };
}

function rpCharacterModal(ownerId, character = null) {
  const modal = new ModalBuilder().setCustomId(character ? `rp:saveedit:${character.id}:${ownerId}` : `rp:savecreate:${ownerId}`).setTitle(character ? "Editar personagem" : "Criar personagem");
  const field = (id, label, style, required, value, placeholder, maxLength) => { const input = new TextInputBuilder().setCustomId(id).setLabel(label).setStyle(style).setRequired(required).setMaxLength(maxLength).setPlaceholder(placeholder); if (value) input.setValue(value); return input; };
  modal.addComponents(
    new ActionRowBuilder().addComponents(field("name", "Nome do personagem", TextInputStyle.Short, true, character?.name, "Ex.: Kanome", 32)),
    new ActionRowBuilder().addComponents(field("image", "URL da imagem (opcional)", TextInputStyle.Short, false, character?.imageUrl, "https://...", 500)),
    new ActionRowBuilder().addComponents(field("description", "Descrição", TextInputStyle.Paragraph, false, character?.description, "Aparência, personalidade e características", 1000)),
    new ActionRowBuilder().addComponents(field("intro", "Pequena apresentação", TextInputStyle.Paragraph, false, character?.introduction, "Como o personagem se apresenta", 700)));
  return modal;
}

function rpComposeModal(ownerId, character) {
  const modal = new ModalBuilder().setCustomId(`rp:publish:${character.id}:${ownerId}`).setTitle(`Interpretar • ${character.name}`);
  const input = new TextInputBuilder().setCustomId("text").setLabel("Sua interpretação").setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1800).setPlaceholder('*Ação em itálico* • "Fala do personagem" • 💭 *Pensamento*');
  modal.addComponents(new ActionRowBuilder().addComponents(input));
  return modal;
}

async function publishAsRpCharacter(channel, client, character, ownerId, text) {
  if (!channel?.isTextBased?.() || !channel.guild) throw new Error("Este canal não permite publicação de RP.");
  const permissions = channel.permissionsFor(client.user);
  if (!permissions?.has(PermissionFlagsBits.ManageWebhooks)) throw new Error("A Momoka precisa da permissão Gerenciar Webhooks neste canal para publicar com o nome e avatar do personagem.");
  if (!permissions.has(PermissionFlagsBits.ManageMessages)) throw new Error("A Momoka também precisa da permissão Gerenciar Mensagens para apagar a mensagem original sem deixar duplicatas.");
  const hooks = await channel.fetchWebhooks();
  let webhook = hooks.find(item => item.owner?.id === client.user.id && item.name === "Momoka RP");
  if (!webhook) webhook = await channel.createWebhook({ name: "Momoka RP", reason: "Publicação de personagens do sistema de RP" });
  const content = `<@${ownerId}>\n\n${text}`;
  await webhook.send({ username: character.name, avatarURL: character.imageUrl || client.user.displayAvatarURL({ extension: "png", size: 256 }), content, allowedMentions: { parse: [] } });
}

export async function handleRpMessage(message, client, repository) {
  const match = String(message.content ?? "").trimStart().match(/^RP\.\s*([\s\S]*)$/i);
  if (!match) return false;
  const text = match[1].trim();
  if (!text) {
    await message.reply({ content: "Depois de `RP.` escreva a interpretação que deseja publicar.", allowedMentions: { repliedUser: false } });
    return true;
  }
  const character = await repository.getActiveRpCharacter(message.author.id);
  if (!character) {
    await message.reply({ content: "Você ainda não escolheu um personagem ativo. Use `/personagem` e selecione um personagem antes de enviar `RP.`.", allowedMentions: { repliedUser: false } });
    return true;
  }
  try {
    await publishAsRpCharacter(message.channel, client, character, message.author.id, text);
    await recordNewspaperMoment(repository, message.guild.id, { category: "Cena de RP", text: "Uma nova cena de RP foi interpretada por " + character.name + "." });
    await message.delete();
  } catch (error) {
    console.error("Falha ao publicar interpretação RP:", error.message);
    await message.reply({ content: error.message || "Não consegui publicar sua interpretação. Verifique as permissões do canal.", allowedMentions: { repliedUser: false } }).catch(() => {});
  }
  return true;
}

export async function setupSocialInteractions(client, repository) {
  setupMomokaChat(client, repository);
  startCommunityAutomation(client, repository);
  startNewspaperWeekly(client, repository);
  const commands = [
    new SlashCommandBuilder().setName("social").setDescription("Abre seu painel social privado."),
    new SlashCommandBuilder().setName("personagem").setDescription("Abre sua central privada de personagens e interpretação."),
    new SlashCommandBuilder().setName("mural").setDescription("Configura o canal do Mural da Vila.")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addSubcommand(sub => sub.setName("configurar").setDescription("Define onde a Momoka publicará recordes pessoais.")
        .addChannelOption(option => option.setName("canal").setDescription("Canal do Mural da Vila.").addChannelTypes(ChannelType.GuildText).setRequired(true))),
    new SlashCommandBuilder().setName("momoka-configurar").setDescription("Define o canal de convivência da Momoka.")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addChannelOption(option => option.setName("canal").setDescription("Canal onde a Momoka poderá conversar livremente.").addChannelTypes(ChannelType.GuildText).setRequired(true)),
    ...familyCommands(),
    ...communitySlashCommands,
    ...newspaperSlashCommands,
    ...gameSlashCommands,
    new SlashCommandBuilder().setName("ship").setDescription("Descubra a combinação fictícia entre dois personagens.")
      .addUserOption(option => option.setName("jogador1").setDescription("Primeira pessoa").setRequired(true))
      .addUserOption(option => option.setName("jogador2").setDescription("Segunda pessoa").setRequired(true)),
    ...Object.entries(SOCIAL_COMMANDS).map(([commandName, action]) =>
      new SlashCommandBuilder()
        .setName(commandName)
        .setDescription(SOCIAL_ACTIONS[action].label)
        .addUserOption(option => option.setName("jogador").setDescription("Escolha outra pessoa do servidor.").setRequired(true))
    )
  ];

  client.once("ready", async () => {
    try {
      await client.application.commands.set(commands.map(command => command.toJSON()));
      console.log("Comandos sociais do Discord registrados.");
    } catch (error) {
      console.error("Não foi possível registrar os comandos sociais:", error.message);
    }
  });

  client.on("interactionCreate", async interaction => {
    console.log("Interação Discord recebida:", interaction.commandName || interaction.customId || "outro");
    try {
      if (interaction.isChatInputCommand()) {
        if (interaction.commandName === "mural") {
          if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({ content: "Somente a staff com permissão de gerenciar o servidor pode configurar o Mural da Vila. 🌸", ephemeral: true });
          }
          const channel = interaction.options.getChannel("canal");
          if (!channel?.isTextBased?.() || !channel.guild || channel.guild.id !== interaction.guildId) {
            return interaction.reply({ content: "Escolha um canal de texto deste servidor.", ephemeral: true });
          }
          await repository.setMuralChannel(interaction.guildId, channel.id);
          return interaction.reply({ content: `Mural da Vila configurado em ${channel}! A Momoka publicará ali os avisos de novos recordes pessoais. 🏅`, ephemeral: true });
        }
        if (interaction.commandName === "jornal") return await handleNewspaperCommand(interaction, client, repository);
        if (["missao", "evento", "atividade"].includes(interaction.commandName)) {
          return await handleCommunityCommand(interaction, client, repository);
        }
        if (interaction.commandName === "momoka-configurar") {
          if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({ content: "Somente administradores do servidor podem configurar o canal da Momoka. 🌸", ephemeral: true });
          }
          const channel = interaction.options.getChannel("canal");
          if (!channel?.isTextBased?.() || !channel.guild) {
            return interaction.reply({ content: "Escolha um canal de texto deste servidor.", ephemeral: true });
          }
          await repository.setMomokaChatChannel(interaction.guildId, channel.id);
          return interaction.reply({
            content: `Prontinho! ${channel} agora é meu cantinho de conversa. Nos outros canais, só vou falar quando alguém me mencionar. 🌸`,
            ephemeral: true
          });
        }
        if (["familia", "adotar", "aceitar_adocao", "recusar_adocao", "cancelar_adocao", "desertar", "casar", "aceitar_casamento", "recusar_casamento", "cancelar_casamento", "papel"].includes(interaction.commandName)) {
          return await handleFamilyCommand(interaction, repository);
        }
        if (["jogo", "ranking_jogos"].includes(interaction.commandName)) {
          return await handleGamesCommand(interaction, repository);
        }
        if (interaction.commandName === "ship") {
          const first = interaction.options.getUser("jogador1");
          const second = interaction.options.getUser("jogador2");
          if (!first || !second || first.id === second.id || first.bot || second.bot) {
            return interaction.reply({ content: "Escolha duas pessoas diferentes — e não bots — para o ship. 🌸", ephemeral: true });
          }
          return interaction.reply({ embeds: [buildShipEmbed(first, second)] });
        }

        if (interaction.commandName === "social") {
          await interaction.deferReply({ ephemeral: true });
          const avatar = client.user.displayAvatarURL({ extension: "png", size: 256 });
          return interaction.editReply(mainPanel(interaction.user.id, avatar));
        }
        if (interaction.commandName === "personagem") {
          await interaction.deferReply({ ephemeral: true });
          const characters = await repository.getRpCharacters(interaction.user.id);
          return interaction.editReply(rpHomePanel(interaction.user.id, characters));
        }

        if (Object.hasOwn(SOCIAL_COMMANDS, interaction.commandName)) {
          const action = SOCIAL_COMMANDS[interaction.commandName];
          const target = interaction.options.getUser("jogador");
          if (!target || target.id === interaction.user.id) {
            return interaction.reply({ content: "Escolha outra pessoa para essa interação. 💗", ephemeral: true });
          }
          if (target.bot) {
            return interaction.reply({ content: "Escolha uma pessoa, não outro bot. 🌸", ephemeral: true });
          }
          await interaction.deferReply({ ephemeral: true });
          await publishAction(interaction.channel, interaction.user, target, action, repository);
          return interaction.editReply({ content: "Interação enviada para " + target + "! 🌸" });
        }
      }

      if ((interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) && interaction.customId.startsWith("rp:")) {
        const parts = interaction.customId.split(":");
        const ownerId = parts.at(-1);
        if (interaction.user.id !== ownerId) return interaction.reply({ content: "Este painel pertence a outra pessoa. Use /personagem para abrir o seu. 🌸", ephemeral: true });
        if (interaction.isButton() && parts[1] === "create") return interaction.showModal(rpCharacterModal(ownerId));
        if (interaction.isButton() && parts[1] === "home") return interaction.update(rpHomePanel(ownerId, await repository.getRpCharacters(ownerId)));
        if (interaction.isStringSelectMenu() && parts[1] === "choose") {
          const character = (await repository.getRpCharacters(ownerId)).find(item => item.id === interaction.values[0]);
          if (!character) return interaction.reply({ content: "Não encontrei esse personagem. Abra /personagem novamente.", ephemeral: true });
          await repository.setActiveRpCharacter(ownerId, character.id);
          return interaction.update(rpCharacterPanel(ownerId, character));
        }
        if (interaction.isButton() && parts[1] === "edit") {
          const character = (await repository.getRpCharacters(ownerId)).find(item => item.id === parts[2]);
          if (!character) return interaction.reply({ content: "Esse personagem não foi encontrado.", ephemeral: true });
          return interaction.showModal(rpCharacterModal(ownerId, character));
        }
        if (interaction.isButton() && parts[1] === "delete") {
          const deleted = await repository.deleteRpCharacter(ownerId, parts[2]);
          return interaction.update({ content: deleted ? "Personagem excluído. 🌸" : "Não encontrei esse personagem.", ...rpHomePanel(ownerId, await repository.getRpCharacters(ownerId)) });
        }
        if (interaction.isButton() && parts[1] === "compose") {
          const character = (await repository.getRpCharacters(ownerId)).find(item => item.id === parts[2]);
          if (!character) return interaction.reply({ content: "Esse personagem não foi encontrado.", ephemeral: true });
          return interaction.showModal(rpComposeModal(ownerId, character));
        }
        if (interaction.isModalSubmit() && (parts[1] === "savecreate" || parts[1] === "saveedit")) {
          const editing = parts[1] === "saveedit";
          const existing = editing ? (await repository.getRpCharacters(ownerId)).find(item => item.id === parts[2]) : null;
          if (editing && !existing) return interaction.reply({ content: "Esse personagem não foi encontrado.", ephemeral: true });
          const name = interaction.fields.getTextInputValue("name").trim();
          const imageUrl = interaction.fields.getTextInputValue("image").trim();
          if (imageUrl && !/^https:\/\//i.test(imageUrl)) return interaction.reply({ content: "A imagem precisa ser um link HTTPS válido.", ephemeral: true });
          if (name.length < 2) return interaction.reply({ content: "O nome precisa ter pelo menos 2 caracteres.", ephemeral: true });
          const character = { id: existing?.id || randomUUID(), name, imageUrl, description: interaction.fields.getTextInputValue("description").trim(), introduction: interaction.fields.getTextInputValue("intro").trim() };
          await repository.saveRpCharacter(ownerId, character);
          await repository.setActiveRpCharacter(ownerId, character.id);
          return interaction.reply({ ...rpCharacterPanel(ownerId, character), ephemeral: true });
        }
        if (interaction.isModalSubmit() && parts[1] === "publish") {
          const characterId = parts[2];
          const character = (await repository.getRpCharacters(ownerId)).find(item => item.id === characterId);
          if (!character) return interaction.reply({ content: "Esse personagem não foi encontrado.", ephemeral: true });
          const message = interaction.fields.getTextInputValue("text").trim();
          if (!message) return interaction.reply({ content: "Escreva algo antes de publicar.", ephemeral: true });
          await interaction.deferReply({ ephemeral: true });
          try { await publishAsRpCharacter(interaction.channel, client, character, ownerId, message); return interaction.editReply({ content: `Sua interpretação foi publicada como **${character.name}**, com sua identificação! 🌸` }); }
          catch (error) { return interaction.editReply({ content: error.message || "Não consegui publicar a interpretação. Verifique as permissões do canal." }); }
        }
      }
      if (interaction.isButton() && interaction.customId.startsWith("family:desertar:")) {
        const [, , action, ownerId, otherId] = interaction.customId.split(":");
        if (interaction.user.id !== ownerId) return interaction.reply({ content: "Somente quem iniciou esta confirmação pode usá-la.", ephemeral: true });
        if (action === "cancel") return interaction.update({ content: "Desvinculação cancelada. Nenhuma alteração foi feita.", components: [] });
        const ok = await repository.cancelAdoption(`discord:${ownerId}`, `discord:${otherId}`);
        return interaction.update({ content: ok ? "🌿 Vínculo de adoção encerrado. A árvore familiar será atualizada e o histórico foi preservado." : "Não encontrei pedido pendente ou adoção ativa entre vocês. Nenhuma alteração foi feita.", components: [] });
      }
      if ((interaction.isButton() || interaction.isUserSelectMenu()) && interaction.customId.startsWith("social:family")) {
        if(!isSocialPanelOwner(interaction.customId,interaction.user.id))return interaction.reply({content:"Este painel pertence a outra pessoa. Use /social para abrir o seu.",ephemeral:true});
        const p=interaction.customId.split(":"),owner=interaction.user.id;
        if(interaction.isButton()&&p[2]==="tree"){
          const player=await repository.getPlayer(`discord:${owner}`);
          if(!player)return interaction.reply({content:"Registre seu personagem primeiro com !registrar SeuNome.",ephemeral:true});
          await interaction.deferReply({ephemeral:true});
          const fam=await repository.getFamily(`discord:${owner}`);
          const png=await renderFamilyTree({player,family:fam,ownerId:owner,client,repository});
          const attachment=new AttachmentBuilder(png,{name:"arvore-genealogica.png"});
          const e=new EmbedBuilder().setColor(0xB68A45).setTitle(`🌳 Linhagem de ${player.name}`).setDescription("Uma história, muitos laços. Cada retrato representa alguém que faz parte da sua família.").setImage("attachment://arvore-genealogica.png").setFooter({text:"Shinobi no Michi • Árvore genealógica"});
          return interaction.editReply({embeds:[e],files:[attachment]});
        }
        if(interaction.isButton()&&["adopt","marry","unlink","divorce"].includes(p[2])){
          const act=p[2],menu=new UserSelectMenuBuilder().setCustomId(`social:familytarget:${act}:${owner}`).setPlaceholder("Escolha a pessoa").setMinValues(1).setMaxValues(1);
          const q={adopt:"Quem você deseja convidar para fazer parte da família?",marry:"Quem você deseja pedir em casamento?",unlink:"Quem você deseja deserdar?",divorce:"De quem você deseja se divorciar?"};
          return interaction.reply({content:q[act],components:[new ActionRowBuilder().addComponents(menu)],ephemeral:true});
        }
        if(interaction.isUserSelectMenu()&&p[1]==="familytarget"){
          const act=p[2],target=interaction.users.first(),actor=`discord:${owner}`,other=`discord:${target?.id}`;
          if(!target||target.bot||target.id===owner)return interaction.reply({content:"Escolha outra pessoa do servidor.",ephemeral:true});
          if(act==="adopt"||act==="marry"){
            if(!await repository.getPlayer(actor)||!await repository.getPlayer(other))return interaction.reply({content:"Os dois jogadores precisam ter personagens registrados.",ephemeral:true});
            const marriage=act==="marry",result=marriage?await repository.createMarriageRequest(actor,other):await repository.createAdoptionRequest(actor,other);
            if(result!=="created")return interaction.reply({content:result==="married"?"Uma das pessoas já possui casamento ativo. Encerre o vínculo atual antes de casar novamente.":result==="related"?"Não é possível casar com alguém que já faz parte da sua família.":"Já existe um pedido ou vínculo ativo entre vocês.",ephemeral:true});
            const e=new EmbedBuilder().setColor(marriage?0xE89BB5:0x8DBB83).setTitle(marriage?"💍 Um pedido especial":"🌱 Um novo laço pode nascer").setDescription(marriage?`${interaction.user} gostaria de construir uma história a dois com ${target}. ${target}, você aceita?`:`${interaction.user} deseja adotar ${target} e construir uma família. ${target}, você aceita?`).setFooter({text:marriage?"O registro começa neutro. Use /papel para escolher Masculino, Feminino ou Prefiro não dizer.":"A decisão é sua. O vínculo só começa com seu consentimento."});
            const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`family:${marriage?"marriage":"adoption"}:accept:${owner}:${target.id}`).setLabel("Aceitar").setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId(`family:${marriage?"marriage":"adoption"}:decline:${owner}:${target.id}`).setLabel("Recusar").setStyle(ButtonStyle.Secondary));
            await interaction.channel.send({content:target.toString(),embeds:[e],components:[row],allowedMentions:{users:[target.id]}});
            return interaction.update({content:"Convite publicado neste canal. 🌸",components:[]});
          }
          if(act==="unlink")return interaction.reply({content:`Você confirma que deseja deserdar ${target}? A árvore familiar será atualizada e o histórico será preservado.`,components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`family:unlink-confirm:${owner}:${target.id}`).setLabel("Sim, confirmar").setStyle(ButtonStyle.Danger),new ButtonBuilder().setCustomId("social:back:"+owner).setLabel("Cancelar").setStyle(ButtonStyle.Secondary))],ephemeral:true});
          if(act==="divorce"){const ok=await repository.cancelMarriage(actor,other);return interaction.update({content:ok?"💔 Divórcio concluído. O histórico foi preservado.":"Não encontrei casamento ativo entre vocês.",components:[]});}
        }
      }
      if(interaction.isButton()&&interaction.customId.startsWith("family:unlink-confirm:")){
        const [, ,owner,other]=interaction.customId.split(":");
        if(interaction.user.id!==owner)return interaction.reply({content:"Somente quem iniciou pode confirmar.",ephemeral:true});
        const ok=await repository.cancelAdoption(`discord:${owner}`,`discord:${other}`);
        return interaction.update({content:ok?"🌿 Vínculo encerrado. O histórico foi preservado.":"Não encontrei adoção ativa entre vocês.",components:[]});
      }
      if(interaction.isButton()&&(interaction.customId.startsWith("family:adoption:")||interaction.customId.startsWith("family:marriage:"))){
        const [,kind,action,requesterId,recipientId]=interaction.customId.split(":");
        if(interaction.user.id!==recipientId)return interaction.reply({content:"Este convite foi destinado a outra pessoa. 🌸",ephemeral:true});
        const requester=`discord:${requesterId}`,recipient=`discord:${recipientId}`;
        if(kind==="adoption"){
          const result=action==="accept"?await repository.acceptAdoptionRequest(requester,recipient):(await repository.declineAdoptionRequest(requester,recipient)?"declined":"missing");
          if(result==="missing")return interaction.reply({content:"Este convite não está mais disponível.",ephemeral:true});
          const ok=result==="accepted",e=EmbedBuilder.from(interaction.message.embeds[0]).setColor(ok?0x8DBB83:0x888888).setFooter({text:ok?"Adoção confirmada. Um novo laço familiar foi criado.":"Convite recusado."});
          return interaction.update({embeds:[e],components:[]});
        }
        if(kind==="marriage"){
          const result=action==="accept"?await repository.acceptMarriageRequest(requester,recipient):(await repository.declineMarriageRequest(requester,recipient)?"declined":"missing");
          if(result==="missing")return interaction.reply({content:"Este convite não está mais disponível.",ephemeral:true});
          if(result==="married")return interaction.reply({content:"Uma das pessoas já possui casamento ativo.",ephemeral:true});
          if(result==="related")return interaction.reply({content:"O casamento não pode ser confirmado porque existe parentesco registrado entre vocês.",ephemeral:true});
          const ok=result==="accepted",e=EmbedBuilder.from(interaction.message.embeds[0]).setColor(ok?0xE89BB5:0x888888).setFooter({text:ok?"Casamento confirmado! O vínculo começa neutro. Use /papel para escolher Masculino, Feminino ou Prefiro não dizer.":"Convite recusado."});
          return interaction.update({embeds:[e],components:[]});
        }
      }
      if (interaction.isButton() && interaction.customId.startsWith("games:")) {
        return await handleGamesInteraction(interaction, repository);
      }
      if (!interaction.isButton() && !interaction.isUserSelectMenu()) return;
      if (!interaction.customId.startsWith("social:")) return;

      if (!isSocialPanelOwner(interaction.customId, interaction.user.id)) {
        return interaction.reply({
          content: "Esse painel pertence a outra pessoa. Use /social para abrir o seu. 🌸",
          ephemeral: true
        });
      }

      const parts = interaction.customId.split(":");
      const ownerId = interaction.user.id;
      const avatar = client.user.displayAvatarURL({ extension: "png", size: 256 });

      if (interaction.isButton() && parts[1] === "back") {
        return interaction.update(mainPanel(ownerId, avatar));
      }

      if (interaction.isButton() && parts[1] === "cat") {
        return interaction.update(categoryPanel(parts[2], ownerId, avatar));
      }

      if (interaction.isButton() && parts[1] === "game") {
        const kind = parts[2];
        if (kind === "dice") {
          const result = Math.floor(Math.random() * 6) + 1;
          const embed = new EmbedBuilder().setColor(0xE89BB5).setTitle("🎲 Desafio dos dados")
            .setDescription("Você lançou o dado e tirou **" + result + "**! " + (result === 6 ? "Um lançamento perfeito!" : "Tente novamente para buscar um 6."));
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("social:game:dice:" + ownerId).setLabel("Lançar novamente").setEmoji("🎲").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("social:cat:jogos:" + ownerId).setLabel("Voltar aos jogos").setEmoji("⬅️").setStyle(ButtonStyle.Secondary)
          );
          return interaction.update({ embeds: [embed], components: [row] });
        }
        if (Object.hasOwn(SHINOBI_GAMES, kind)) return interaction.update(questionGame(kind, ownerId));
      }

      if (interaction.isButton() && parts[1] === "gameanswer") {
        const kind = parts[2], selected = Number(parts[3]), game = SHINOBI_GAMES[kind];
        if (!game || !Number.isInteger(selected) || selected < 0 || selected >= game.choices.length) {
          return interaction.reply({ content: "Esta rodada não está mais disponível. Escolha outro jogo. 🌸", ephemeral: true });
        }
        const correct = selected === game.answer;
        const embed = new EmbedBuilder().setColor(correct ? 0x8DBB83 : 0xD97878)
          .setTitle(correct ? "🎉 Resposta correta!" : "🌸 Boa tentativa!")
          .setDescription((correct ? "Você acertou! " : "A resposta correta era **" + game.choices[game.answer] + "**. ") + game.explanation);
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("social:game:" + kind + ":" + ownerId).setLabel("Jogar novamente").setEmoji("🔄").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("social:cat:jogos:" + ownerId).setLabel("Voltar aos jogos").setEmoji("⬅️").setStyle(ButtonStyle.Secondary)
        );
        return interaction.update({ embeds: [embed], components: [row] });
      }

      if (interaction.isButton() && parts[1] === "ship" && parts[2] === "select") {
        const picker = new UserSelectMenuBuilder()
          .setCustomId("social:shiptarget:" + ownerId)
          .setPlaceholder("Selecione exatamente duas pessoas")
          .setMinValues(2)
          .setMaxValues(2);
        const back = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("social:cat:shipp:" + ownerId).setLabel("Voltar").setEmoji("⬅️").setStyle(ButtonStyle.Secondary)
        );
        const embed = new EmbedBuilder().setColor(0xD98BB8).setTitle("💘 Escolha a dupla")
          .setDescription("Selecione duas pessoas do servidor. A Momoka vai preparar um cartão especial para essa dupla!");
        return interaction.update({ embeds: [embed], components: [new ActionRowBuilder().addComponents(picker), back] });
      }

      if (interaction.isUserSelectMenu() && parts[1] === "shiptarget") {
        const selected = Array.from(interaction.users.values());
        if (selected.length !== 2 || selected[0].id === selected[1].id || selected.some(user => user.bot)) {
          return interaction.reply({ content: "Selecione exatamente duas pessoas diferentes que não sejam bots. 🌸", ephemeral: true });
        }
        await interaction.channel.send({ embeds: [buildShipEmbed(selected[0], selected[1])] });
        const buttons = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("social:cat:shipp:" + ownerId).setLabel("Analisar outra dupla").setEmoji("💘").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("social:cat:relacionamentos:" + ownerId).setLabel("Voltar").setEmoji("⬅️").setStyle(ButtonStyle.Secondary)
        );
        return interaction.update({ content: "O veredito da Momoka foi publicado no canal! 💞", embeds: [], components: [buttons] });
      }

      if (interaction.isButton() && parts[1] === "act") {
        const action = parts[2];
        if (!Object.hasOwn(SOCIAL_ACTIONS, action)) {
          return interaction.reply({ content: "Essa interação não está disponível.", ephemeral: true });
        }
        const picker = new UserSelectMenuBuilder()
          .setCustomId("social:target:" + action + ":" + ownerId)
          .setPlaceholder("Selecione quem receberá a interação")
          .setMinValues(1)
          .setMaxValues(1);
        const back = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("social:cat:interacoes:" + ownerId).setLabel("Voltar").setEmoji("⬅️").setStyle(ButtonStyle.Secondary)
        );
        const embed = new EmbedBuilder().setColor(0xE89BB5).setTitle(SOCIAL_ACTIONS[action].label + " 💗").setDescription("Escolha uma pessoa do servidor. A publicação aparecerá no canal.");
        return interaction.update({ embeds: [embed], components: [new ActionRowBuilder().addComponents(picker), back] });
      }

      if (interaction.isUserSelectMenu() && parts[1] === "target") {
        const action = parts[2];
        const target = interaction.users.first();
        if (!Object.hasOwn(SOCIAL_ACTIONS, action) || !target) {
          return interaction.reply({ content: "Não consegui identificar essa interação.", ephemeral: true });
        }
        if (target.id === interaction.user.id) {
          return interaction.reply({ content: "Escolha outra pessoa para essa interação. 💗", ephemeral: true });
        }
        if (target.bot) {
          return interaction.reply({ content: "Escolha uma pessoa, não outro bot. 🌸", ephemeral: true });
        }
        await publishAction(interaction.channel, interaction.user, target, action, repository);
        const buttons = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("social:cat:interacoes:" + ownerId).setLabel("Mais interações").setEmoji("🤗").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("social:back:" + ownerId).setLabel("Voltar ao painel").setEmoji("⬅️").setStyle(ButtonStyle.Secondary)
        );
        return interaction.update({
          content: "Prontinho! Sua interação com " + target + " foi publicada no canal. 🌸",
          embeds: [],
          components: [buttons]
        });
      }
    } catch (error) {
      console.error("Falha ao processar interação social:", error.message);
      if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "A Momoka encontrou um problema. Tente novamente em instantes.", ephemeral: true }).catch(() => {});
      }
    }
  });
}
