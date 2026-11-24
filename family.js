import { SlashCommandBuilder } from "discord.js";

export function familyCommands() {
  return [
    new SlashCommandBuilder()
      .setName("familia")
      .setDescription("Veja sua família e os pedidos de adoção."),
    new SlashCommandBuilder()
      .setName("adotar")
      .setDescription("Envie um pedido de adoção para outro jogador.")
      .addUserOption(option => option.setName("jogador").setDescription("Quem você deseja adotar como filho ou filha.").setRequired(true)),
    new SlashCommandBuilder()
      .setName("aceitar_adocao")
      .setDescription("Aceite um pedido de adoção.")
      .addUserOption(option => option.setName("responsavel").setDescription("Quem enviou o pedido.").setRequired(true)),
    new SlashCommandBuilder()
      .setName("recusar_adocao")
      .setDescription("Recuse um pedido de adoção.")
      .addUserOption(option => option.setName("responsavel").setDescription("Quem enviou o pedido.").setRequired(true))
  ];
}

export async function handleFamilyCommand(interaction, repository) {
  const actorId = `discord:${interaction.user.id}`;
  const command = interaction.commandName;

  if (command === "familia") {
    await interaction.deferReply({ ephemeral: true });
    const player = await repository.getPlayer(actorId);
    if (!player) return interaction.editReply("Você ainda não criou seu personagem. Use !registrar SeuNome primeiro.");
    const family = await repository.getFamily(actorId);
    const pending = await repository.getPendingAdoptions(actorId);
    const parents = family.parents.map(item => `• ${item.name}`).join("\n") || "• Nenhum responsável registrado";
    const children = family.children.map(item => `• ${item.name}`).join("\n") || "• Nenhum filho ou filha registrado";
    const siblings = family.siblings.map(item => `• ${item.name}`).join("\n") || "• Nenhum irmão ou irmã registrado";
    const grandparents = family.grandparents.map(item => `• ${item.name}`).join("\n") || "• Nenhum avô ou avó registrado";
    const grandchildren = family.grandchildren.map(item => `• ${item.name}`).join("\n") || "• Nenhum neto ou neta registrado";
    const requests = pending.length
      ? pending.map(item => `• ${item.parentName} — <@${item.parentDiscordId}>`).join("\n")
      : "• Nenhum pedido pendente";
    return interaction.editReply([
      `🌳 **Família de ${player.name}**`,
      "",
      "**Pais e responsáveis**",
      parents,
      "",
      "**Filhos e filhas**",
      children,
      "",
      "**Irmãos e irmãs**",
      siblings,
      "",
      "**Avós**",
      grandparents,
      "",
      "**Netos e netas**",
      grandchildren,
      "",
      "**Pedidos de adoção recebidos**",
      requests,
      "",
      "A família é formada por adoção e não há limite de filhos. A adoção só acontece após a aceitação."
    ].join("\n"));
  }

  if (command === "adotar") {
    const target = interaction.options.getUser("jogador");
    if (!target || target.bot || target.id === interaction.user.id) {
      return interaction.reply({ content: "Escolha outro jogador que tenha personagem registrado. 🌸", ephemeral: true });
    }
    const parent = await repository.getPlayer(actorId);
    const child = await repository.getPlayer(`discord:${target.id}`);
    if (!parent) return interaction.reply({ content: "Você precisa registrar seu personagem com !registrar antes de adotar.", ephemeral: true });
    if (!child) return interaction.reply({ content: "Essa pessoa ainda não registrou um personagem no RPG.", ephemeral: true });
    const result = await repository.createAdoptionRequest(actorId, `discord:${target.id}`);
    if (result === "duplicate") return interaction.reply({ content: "Já existe um pedido ou vínculo de adoção entre vocês.", ephemeral: true });
    await interaction.reply({ content: `🌸 Pedido de adoção enviado para ${target}. A adoção só será registrada se essa pessoa aceitar.`, ephemeral: true });
    await target.send(`🌸 ${interaction.user.username} enviou um pedido para ser seu responsável no Shinobi no Michi. Se quiser aceitar, use /aceitar_adocao e selecione essa pessoa no campo responsável. Para recusar, use /recusar_adocao.`).catch(() => {});
    return;
  }

  if (command === "aceitar_adocao" || command === "recusar_adocao") {
    const parentUser = interaction.options.getUser("responsavel");
    if (!parentUser || parentUser.bot || parentUser.id === interaction.user.id) {
      return interaction.reply({ content: "Selecione a pessoa que enviou o pedido.", ephemeral: true });
    }
    const parentId = `discord:${parentUser.id}`;
    const childPlayer = await repository.getPlayer(actorId);
    const parentPlayer = await repository.getPlayer(parentId);
    if (!childPlayer || !parentPlayer) return interaction.reply({ content: "Os dois jogadores precisam ter personagens registrados.", ephemeral: true });
    if (command === "recusar_adocao") {
      const declined = await repository.declineAdoptionRequest(parentId, actorId);
      return interaction.reply({ content: declined ? "Pedido de adoção recusado. Nenhum vínculo foi criado." : "Não encontrei um pedido pendente dessa pessoa.", ephemeral: true });
    }
    const accepted = await repository.acceptAdoptionRequest(parentId, actorId);
    if (accepted === "missing") return interaction.reply({ content: "Não encontrei um pedido pendente dessa pessoa.", ephemeral: true });
    if (accepted === "cycle") return interaction.reply({ content: "Esse vínculo criaria um ciclo na árvore familiar e não pode ser registrado.", ephemeral: true });
    if (accepted === "exists") return interaction.reply({ content: "Esse vínculo familiar já existe.", ephemeral: true });
    return interaction.reply({ content: `🌳 A adoção foi confirmada! ${parentPlayer.name} agora é responsável por ${childPlayer.name} no Shinobi no Michi.`, ephemeral: false });
  }
}
