import { familyCommands, handleFamilyCommand } from "./family.js";
import { renderFamilyTree } from "./family-tree.js";

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
  hug: {
    label: "Abraçar",
    verb: "deu um abraço em",
    gifs: [
      "https://media.giphy.com/media/Jweze3z5nvgLXNATvE/giphy.gif",
      "https://media.giphy.com/media/yc4ZPBuo4broxc9cRn/giphy.gif",
      "https://media.giphy.com/media/nsYlsQmxYIY5jVqe6j/giphy.gif"
    ]
  },
  pat: {
    label: "Fazer carinho",
    verb: "fez carinho na cabeça de",
    gifs: [
      "https://media.giphy.com/media/z8OKNbMR8LsqhBZR1Q/giphy.gif",
      "https://media.giphy.com/media/Fr3nvJHT7nkZ4TNrhX/giphy.gif",
      "https://media.giphy.com/media/lSDpJnjigpfor1udlm/giphy.gif"
    ]
  },
  wave: {
    label: "Cumprimentar",
    verb: "acenou para",
    gifs: [
      "https://media.giphy.com/media/FraE0FGfEc091zpkNZ/giphy.gif",
      "https://media.giphy.com/media/ktLSY7TZFY3Rie2JZM/giphy.gif"
    ]
  },
  dance: {
    label: "Dançar",
    verb: "dançou para",
    gifs: ["https://media.giphy.com/media/kOhxnWg9jYBXG6uedj/giphy.gif"]
  },
  happy: {
    label: "Feliz",
    verb: "ficou feliz com",
    gifs: ["https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif"]
  },
  angry: {
    label: "Expressar raiva",
    verb: "fez uma expressão de raiva para",
    gifs: ["https://media.giphy.com/media/wjzlpNjQxRFGMBKz2X/giphy.gif"]
  },
  sad: {
    label: "Expressar tristeza",
    verb: "ficou triste perto de",
    gifs: ["https://media.giphy.com/media/ROF8OQvDmxytW/giphy.gif"]
  },
  attack: {
    label: "Atacar",
    verb: "atacou",
    gifs: [
      "https://media.giphy.com/media/Yl3oC8pHe9HkoqMa4R/giphy.gif",
      "https://media.giphy.com/media/MaTKHJTWlEHe0sDsML/giphy.gif",
      "https://media.giphy.com/media/VtBS7Vvb1YiteCGgZ8/giphy.gif"
    ]
  }
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

function randomGif(action) {
  const gifs = SOCIAL_ACTIONS[action].gifs;
  return gifs[Math.floor(Math.random() * gifs.length)];
}

function mainPanel(ownerId, avatarUrl) {
  const embed = new EmbedBuilder()
    .setColor(0xE89BB5)
    .setTitle("🌸 Cantinho Social da Momoka")
    .setDescription(
      "Escolha uma categoria! Este painel é privado e só você pode controlá-lo.\n\n" +
      "**🤗 Interações** — abraço, carinho, cumprimento, dança, felicidade e reações.\n" +
      "**💞 Relacionamentos** — em desenvolvimento.\n" +
      "**🌳 Família** — adoção, responsáveis e árvore familiar.\n" +
      "**🎭 Roleplay** — em desenvolvimento.\n" +
      "**🎮 Jogos** — em desenvolvimento.\n" +
      "**🏮 Eventos** — em desenvolvimento."
    );

  const rowOne = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("social:cat:interacoes:" + ownerId).setLabel("Interações").setEmoji("🤗").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("social:cat:relacionamentos:" + ownerId).setLabel("Relacionamentos").setEmoji("💞").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("social:cat:familia:" + ownerId).setLabel("Família").setEmoji("🌳").setStyle(ButtonStyle.Secondary)
  );
  const rowTwo = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("social:cat:roleplay:" + ownerId).setLabel("Roleplay").setEmoji("🎭").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("social:cat:jogos:" + ownerId).setLabel("Jogos").setEmoji("🎮").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("social:cat:eventos:" + ownerId).setLabel("Eventos").setEmoji("🏮").setStyle(ButtonStyle.Secondary)
  );
  return { embeds: [embed], components: [rowOne, rowTwo] };
}

function categoryPanel(category, ownerId, avatarUrl) {
  const back = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("social:back:" + ownerId).setLabel("Voltar").setEmoji("⬅️").setStyle(ButtonStyle.Secondary)
  );
  if (category === "interacoes") {
    const embed = new EmbedBuilder()
      .setColor(0xE89BB5)
      .setTitle("🤗 Interações")
      .setDescription("Escolha uma interação e selecione uma pessoa. A publicação no canal mostrará somente a ação e o GIF.\n\nAtalhos: /abracar, /carinho, /cumprimentar, /dancar, /feliz, /raiva, /tristeza e /atacar.");
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
    const embed=new EmbedBuilder().setColor(0x8DBB83).setTitle("🌳 Família & Laços").setDescription("Construa sua própria história no Shinobi no Michi. A família nasce da adoção, sem limite de filhos e sem exigir casamento.\n\n**Comandos**\n/familia — árvore genealógica\n/adotar jogador — convite de adoção\n/desertar jogador — encerrar adoção\n/casar jogador — pedido de casamento\n/cancelar_casamento pessoa — encerrar vínculo\n/papel — escolher Cônjuge, Marido ou Esposa\n\nOs convites aparecem no canal e só são concluídos com consentimento.");
    const row1=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("social:family:tree:"+ownerId).setLabel("Minha família").setEmoji("🌳").setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId("social:family:adopt:"+ownerId).setLabel("Adotar").setEmoji("🌱").setStyle(ButtonStyle.Primary),new ButtonBuilder().setCustomId("social:family:marry:"+ownerId).setLabel("Casamento").setEmoji("💍").setStyle(ButtonStyle.Primary));
    const row2=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("social:family:unlink:"+ownerId).setLabel("Desvincular adoção").setEmoji("🍃").setStyle(ButtonStyle.Secondary),new ButtonBuilder().setCustomId("social:family:divorce:"+ownerId).setLabel("Encerrar casamento").setEmoji("💔").setStyle(ButtonStyle.Secondary),back.components[0]);
    return {embeds:[embed],components:[row1,row2]};
  }

  const sections = {
    relacionamentos: ["💞 Relacionamentos", " **/casar jogador** — enviar pedido.\n**/aceitar_casamento pessoa** ou **/recusar_casamento pessoa** — responder.\n**/cancelar_casamento pessoa** — qualquer um pode encerrar. O anel da loja será conectado depois."],
    familia: ["🌳 Família", "Consulte a área Família para ver os comandos de adoção."],
    roleplay: ["🎭 Roleplay", "As ferramentas de interpretação e personagens serão desenvolvidas em uma próxima etapa."],
    jogos: ["🎮 Jogos", "Os minijogos e atividades interativas serão desenvolvidos em uma próxima etapa."],
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
    .setImage(randomGif(action));
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
          const png=await renderFamilyTree({player,family:fam,ownerId:owner,client});
          const attachment=new AttachmentBuilder(png,{name:"arvore-genealogica.png"});
          const e=new EmbedBuilder().setColor(0xB68A45).setTitle(`🌳 Linhagem de ${player.name}`).setDescription("Uma história, muitos laços. Cada retrato representa alguém que faz parte da sua família.").setImage("attachment://arvore-genealogica.png").setFooter({text:"Shinobi no Michi • Árvore genealógica"});
          return interaction.editReply({embeds:[e],files:[attachment]});
        }
        if(interaction.isButton()&&["adopt","marry","unlink","divorce"].includes(p[2])){
          const act=p[2],menu=new UserSelectMenuBuilder().setCustomId(`social:familytarget:${act}:${owner}`).setPlaceholder("Escolha a pessoa").setMinValues(1).setMaxValues(1);
          const q={adopt:"Quem você deseja convidar para fazer parte da família?",marry:"Quem você deseja pedir em casamento?",unlink:"Com quem deseja encerrar o vínculo de adoção?",divorce:"Com quem deseja encerrar o casamento?"};
          return interaction.reply({content:q[act],components:[new ActionRowBuilder().addComponents(menu)],ephemeral:true});
        }
        if(interaction.isUserSelectMenu()&&p[1]==="familytarget"){
          const act=p[2],target=interaction.users.first(),actor=`discord:${owner}`,other=`discord:${target?.id}`;
          if(!target||target.bot||target.id===owner)return interaction.reply({content:"Escolha outra pessoa do servidor.",ephemeral:true});
          if(act==="adopt"||act==="marry"){
            if(!await repository.getPlayer(actor)||!await repository.getPlayer(other))return interaction.reply({content:"Os dois jogadores precisam ter personagens registrados.",ephemeral:true});
            const marriage=act==="marry",result=marriage?await repository.createMarriageRequest(actor,other):await repository.createAdoptionRequest(actor,other);
            if(result!=="created")return interaction.reply({content:result==="married"?"Uma das pessoas já possui casamento ativo. Encerre o vínculo atual antes de casar novamente.":result==="related"?"Não é possível casar com alguém que já faz parte da sua família.":"Já existe um pedido ou vínculo ativo entre vocês.",ephemeral:true});
            const e=new EmbedBuilder().setColor(marriage?0xE89BB5:0x8DBB83).setTitle(marriage?"💍 Um pedido especial":"🌱 Um novo laço pode nascer").setDescription(marriage?`${interaction.user} gostaria de construir uma história a dois com ${target}. ${target}, você aceita?`:`${interaction.user} deseja adotar ${target} e construir uma família. ${target}, você aceita?`).setFooter({text:marriage?"O registro inicial será neutro: Cônjuge. Use /papel para alterar entre esposa ou marido.":"A decisão é sua. O vínculo só começa com seu consentimento."});
            const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`family:${marriage?"marriage":"adoption"}:accept:${owner}:${target.id}`).setLabel("Aceitar").setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId(`family:${marriage?"marriage":"adoption"}:decline:${owner}:${target.id}`).setLabel("Recusar").setStyle(ButtonStyle.Secondary));
            await interaction.channel.send({content:target.toString(),embeds:[e],components:[row],allowedMentions:{users:[target.id]}});
            return interaction.update({content:"Convite publicado neste canal. 🌸",components:[]});
          }
          if(act==="unlink")return interaction.reply({content:`Confirma encerrar o vínculo de adoção com ${target}?`,components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`family:unlink-confirm:${owner}:${target.id}`).setLabel("Sim, desvincular").setStyle(ButtonStyle.Danger),new ButtonBuilder().setCustomId("social:back:"+owner).setLabel("Cancelar").setStyle(ButtonStyle.Secondary))],ephemeral:true});
          if(act==="divorce"){const ok=await repository.cancelMarriage(actor,other);return interaction.update({content:ok?"💔 Casamento encerrado. O histórico foi preservado.":"Não encontrei casamento ativo entre vocês.",components:[]});}
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
          const ok=result==="accepted",e=EmbedBuilder.from(interaction.message.embeds[0]).setColor(ok?0xE89BB5:0x888888).setFooter({text:ok?"Casamento confirmado! Ambos começam como Cônjuge e podem alterar o próprio papel com /papel_casamento.":"Convite recusado."});
          return interaction.update({embeds:[e],components:[]});
        }
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
