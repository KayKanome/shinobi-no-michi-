import { familyCommands, handleFamilyCommand } from "./family.js";

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  UserSelectMenuBuilder
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
    const embed = new EmbedBuilder()
      .setColor(0xE89BB5)
      .setTitle("🌳 Família")
      .setDescription("O sistema de família funciona por adoção. Não há limite de filhos e não é necessário estar casado para ser pai ou mãe.\n\n**/familia** — consultar sua família e pedidos recebidos.\n**/adotar jogador** — enviar um pedido de adoção.\n**/aceitar_adocao responsavel** — aceitar um pedido.\n**/recusar_adocao responsavel** — recusar um pedido.\n**/desertar jogador** — encerrar um vínculo de adoção, com confirmação.\n\nA adoção só é concluída com a aceitação da outra pessoa. O certificado da loja será conectado depois.");
    return { embeds: [embed], components: [back] };
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
        if (["familia", "adotar", "aceitar_adocao", "recusar_adocao", "cancelar_adocao", "desertar", "casar", "aceitar_casamento", "recusar_casamento", "cancelar_casamento"].includes(interaction.commandName)) {
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
