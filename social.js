import { familyCommands, handleFamilyCommand } from "./family.js";
import { renderFamilyTree } from "./family-tree.js";
import { buildGamesPanel, gameSlashCommands, handleGamesCommand, handleGamesInteraction } from "./games.js";

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  UserSelectMenuBuilder,
  AttachmentBuilder
} from "discord.js";

export const SOCIAL_ACTIONS = {
  hug: { label: "Abraçar", verb: "deu um abraço em" },
  pat: { label: "Fazer carinho", verb: "fez carinho na cabeça de" },
  wave: { label: "Cumprimentar", verb: "acenou para" },
  dance: { label: "Dançar", verb: "dançou para" },
  happy: { label: "Feliz", verb: "ficou feliz com" },
  angry: { label: "Expressar raiva", verb: "fez uma expressão de raiva para" },
  sad: { label: "Expressar tristeza", verb: "ficou triste perto de" },
  attack: { label: "Atacar", verb: "atacou" }
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
  ]
};

const SOCIAL_COMMANDS = {
  abracar: "hug",
  carinho: "pat",
  cumprimentar: "wave",
  dancar: "dance",
  feliz: "happy",
  raiva: "angry",
  tristeza: "sad",
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
    new ButtonBuilder().setCustomId("social:cat:eventos:" + ownerId).setLabel("Eventos").setEmoji("🏮").setStyle(ButtonStyle.Secondary)
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
      .setDescription("Escolha uma interação e selecione uma pessoa. A publicação no canal mostrará a ação. Os GIFs serão adicionados conforme você enviar.\n\nAtalhos: /abracar, /carinho, /cumprimentar, /dancar, /feliz, /raiva, /tristeza e /atacar.");
    const actionsOne = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("social:act:hug:" + ownerId).setLabel("Abraçar").setEmoji("🫂").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("social:act:pat:" + ownerId).setLabel("Carinho").setEmoji("🐾").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("social:act:wave:" + ownerId).setLabel("Cumprimentar").setEmoji("👋").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("social:act:dance:" + ownerId).setLabel("Dançar").setEmoji("💃").setStyle(ButtonStyle.Primary)
    );
    const actionsTwo = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("social:act:happy:" + ownerId).setLabel("Feliz").setEmoji("😊").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("social:act:angry:" + ownerId).setLabel("Raiva").setEmoji("😠").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("social:act:sad:" + ownerId).setLabel("Tristeza").setEmoji("😢").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("social:act:attack:" + ownerId).setLabel("Atacar").setEmoji("✨").setStyle(ButtonStyle.Danger)
    );
    return { embeds: [embed], components: [actionsOne, actionsTwo, back] };
  }

  if (category === "familia") {
    const embed=new EmbedBuilder().setColor(0x8DBB83).setTitle("🌳 Família & Laços").setDescription("Construa sua própria história no Shinobi no Michi. A família nasce da adoção, sem limite de filhos e sem exigir casamento.\n\n**Comandos**\n/familia — árvore genealógica\n/adotar jogador — convite de adoção\n/desertar jogador — deserdar um vínculo de adoção\n/casar jogador — pedido de casamento\n/cancelar_casamento pessoa — pedir divórcio\n/papel — escolher Masculino, Feminino ou Prefiro não dizer\n\nOs convites aparecem no canal e só são concluídos com consentimento.");
    const row1=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("social:family:tree:"+ownerId).setLabel("Minha família").setEmoji("🌳").setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId("social:family:adopt:"+ownerId).setLabel("Adotar").setEmoji("🌱").setStyle(ButtonStyle.Primary),new ButtonBuilder().setCustomId("social:family:marry:"+ownerId).setLabel("Casamento").setEmoji("💍").setStyle(ButtonStyle.Primary));
    const row2=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("social:family:unlink:"+ownerId).setLabel("Deserdar").setEmoji("🍃").setStyle(ButtonStyle.Secondary),new ButtonBuilder().setCustomId("social:family:divorce:"+ownerId).setLabel("Divórcio").setEmoji("💔").setStyle(ButtonStyle.Secondary),back.components[0]);
    return {embeds:[embed],components:[row1,row2]};
  }

  if (category === "jogos") return buildGamesPanel(ownerId);
  const sections = {
    eventos: ["🏮 Eventos", "Os eventos da comunidade serão desenvolvidos em uma próxima etapa."]
  };
  const section = sections[category] || ["Categoria", "Esta área ainda está sendo preparada."];
  const embed = new EmbedBuilder().setColor(0xE89BB5).setTitle(section[0]).setDescription(section[1]);
  return { embeds: [embed], components: [back] };
}

async function publishAction(channel, actor, target, action) {
  const config = SOCIAL_ACTIONS[action];
  const actorName = actor.globalName || actor.username;
  const targetName = target.globalName || target.username;
  const embed = new EmbedBuilder()
    .setColor(0xE89BB5)
    .setImage(SOCIAL_GIFS[action]?.[Math.floor(Math.random() * SOCIAL_GIFS[action].length)] || null);
  await channel.send({
    content: formatSocialAction(actorName, targetName, action),
    embeds: [embed],
    allowedMentions: { parse: [] }
  });
}

export async function setupSocialInteractions(client, repository) {
  const commands = [
    new SlashCommandBuilder().setName("social").setDescription("Abre seu painel social privado."),
    ...familyCommands(),
    ...gameSlashCommands,
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
        if (["familia", "adotar", "aceitar_adocao", "recusar_adocao", "cancelar_adocao", "desertar", "casar", "aceitar_casamento", "recusar_casamento", "cancelar_casamento", "papel"].includes(interaction.commandName)) {
          return await handleFamilyCommand(interaction, repository);
        }
        if (["jogo", "ranking_jogos"].includes(interaction.commandName)) {
          return await handleGamesCommand(interaction, repository);
        }
        if (interaction.commandName === "social") {
          await interaction.deferReply({ ephemeral: true });
          const avatar = client.user.displayAvatarURL({ extension: "png", size: 256 });
          return interaction.editReply(mainPanel(interaction.user.id, avatar));
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
          await publishAction(interaction.channel, interaction.user, target, action);
          return interaction.editReply({ content: "Interação enviada para " + target + "! 🌸" });
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
        await publishAction(interaction.channel, interaction.user, target, action);
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
