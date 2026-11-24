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
  attack: {
    label: "Atacar (poder de anime)",
    verb: "lançou um poder de anime na direção de",
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
  atacar: "attack"
};

export function formatSocialAction(actorName, targetName, action) {
  const config = SOCIAL_ACTIONS[action];
  if (!config) throw new Error("Interação social desconhecida.");
  return "**" + actorName + "** " + config.verb + " **" + targetName + "**!";
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
      "**🤗 Interações** — abrace, faça carinho, cumprimente ou use um poder de anime.\n" +
      "**💞 Relacionamentos** — em desenvolvimento.\n" +
      "**🌳 Família** — em desenvolvimento.\n" +
      "**🎭 Roleplay** — em desenvolvimento.\n" +
      "**🎮 Jogos** — em desenvolvimento.\n" +
      "**🏮 Eventos** — em desenvolvimento."
    )
    .setThumbnail(avatarUrl);

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
      .setDescription("Escolha o que deseja fazer e depois selecione uma pessoa. A interação será publicada no canal.")
      .setThumbnail(avatarUrl);
    const actions = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("social:act:hug:" + ownerId).setLabel("Abraçar").setEmoji("🫂").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("social:act:pat:" + ownerId).setLabel("Fazer carinho").setEmoji("🐾").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("social:act:wave:" + ownerId).setLabel("Cumprimentar").setEmoji("👋").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("social:act:attack:" + ownerId).setLabel("Atacar").setEmoji("✨").setStyle(ButtonStyle.Danger)
    );
    return { embeds: [embed], components: [actions, back] };
  }

  const sections = {
    relacionamentos: ["💞 Relacionamentos", "O espaço de laços e compatibilidade será desenvolvido em uma próxima etapa."],
    familia: ["🌳 Família", "A criação de famílias e a árvore genealógica chegarão em uma próxima etapa."],
    roleplay: ["🎭 Roleplay", "As ferramentas de interpretação e personagens serão desenvolvidas em uma próxima etapa."],
    jogos: ["🎮 Jogos", "Os minijogos e atividades interativas serão desenvolvidos em uma próxima etapa."],
    eventos: ["🏮 Eventos", "Os eventos da comunidade serão desenvolvidos em uma próxima etapa."]
  };
  const section = sections[category] || ["Categoria", "Esta área ainda está sendo preparada."];
  const embed = new EmbedBuilder().setColor(0xE89BB5).setTitle(section[0]).setDescription(section[1]).setThumbnail(avatarUrl);
  return { embeds: [embed], components: [back] };
}

async function publishAction(channel, actor, target, action) {
  const config = SOCIAL_ACTIONS[action];
  const actorName = actor.globalName || actor.username;
  const targetName = target.globalName || target.username;
  const embed = new EmbedBuilder()
    .setColor(0xE89BB5)
    .setDescription(formatSocialAction(actorName, targetName, action))
    .setImage(randomGif(action))
    .setFooter({ text: "Shinobi no Michi • Momoka" });
  await channel.send({
    content: "<@" + actor.id + "> <@" + target.id + ">",
    embeds: [embed],
    allowedMentions: { users: [actor.id, target.id] }
  });
}

export async function setupSocialInteractions(client) {
  const commands = [
    new SlashCommandBuilder().setName("social").setDescription("Abre seu painel social privado."),
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
    try {
      if (interaction.isChatInputCommand()) {
        if (interaction.commandName === "social") {
          const avatar = client.user.displayAvatarURL({ extension: "png", size: 256 });
          return interaction.reply({ ...mainPanel(interaction.user.id, avatar), ephemeral: true });
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
