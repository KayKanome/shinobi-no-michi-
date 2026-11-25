import { SlashCommandBuilder } from "discord.js";

export function familyCommands() {
  return [
    new SlashCommandBuilder().setName("familia").setDescription("Veja sua família, casamento e pedidos recebidos."),
    new SlashCommandBuilder().setName("adotar").setDescription("Envie um pedido de adoção.").addUserOption(o => o.setName("jogador").setDescription("Quem você deseja adotar como filho ou filha.").setRequired(true)),
    new SlashCommandBuilder().setName("aceitar_adocao").setDescription("Aceite um pedido de adoção.").addUserOption(o => o.setName("responsavel").setDescription("Quem enviou o pedido.").setRequired(true)),
    new SlashCommandBuilder().setName("recusar_adocao").setDescription("Recuse um pedido de adoção.").addUserOption(o => o.setName("responsavel").setDescription("Quem enviou o pedido.").setRequired(true)),
    new SlashCommandBuilder().setName("cancelar_adocao").setDescription("Cancele um pedido de adoção.").addUserOption(o => o.setName("jogador").setDescription("A outra pessoa envolvida.").setRequired(true)),
    new SlashCommandBuilder().setName("desertar").setDescription("Encerre um vínculo de adoção com confirmação.").addUserOption(o => o.setName("jogador").setDescription("Seu responsável ou filho adotivo.").setRequired(true)),
    new SlashCommandBuilder().setName("casar").setDescription("Peça outra pessoa em casamento.").addUserOption(o => o.setName("jogador").setDescription("Com quem deseja se casar.").setRequired(true)),
    new SlashCommandBuilder().setName("aceitar_casamento").setDescription("Aceite um pedido de casamento.").addUserOption(o => o.setName("pessoa").setDescription("Quem enviou o pedido.").setRequired(true)),
    new SlashCommandBuilder().setName("recusar_casamento").setDescription("Recuse um pedido de casamento.").addUserOption(o => o.setName("pessoa").setDescription("Quem enviou o pedido.").setRequired(true)),
    new SlashCommandBuilder().setName("cancelar_casamento").setDescription("Encerre um casamento ou cancele um pedido.").addUserOption(o => o.setName("pessoa").setDescription("A outra pessoa envolvida.").setRequired(true))
  ];
}
const validOther = (user, interaction) => user && !user.bot && user.id !== interaction.user.id;

export async function handleFamilyCommand(interaction, repository) {
  const actorId = `discord:${interaction.user.id}`;
  const command = interaction.commandName;
  if (command === "familia") {
    await interaction.deferReply({ ephemeral: true });
    const player = await repository.getPlayer(actorId);
    if (!player) return interaction.editReply("Você ainda não criou seu personagem. Use !registrar SeuNome primeiro.");
    const f = await repository.getFamily(actorId);
    const adoptions = await repository.getPendingAdoptions(actorId);
    const marriages = await repository.getPendingMarriages(actorId);
    const section = (title, rows, empty) => [`**${title}**`, rows.length ? rows.map(x => `• ${x.name}`).join("\n") : `• ${empty}`].join("\n");
    return interaction.editReply([
      `🌳 **Família de ${player.name}**`,
      section("Cônjuge", f.spouse, "Nenhum casamento ativo"),
      section("Pais e responsáveis", f.parents, "Nenhum responsável registrado"),
      section("Filhos e filhas", f.children, "Nenhum filho ou filha registrado"),
      section("Irmãos e irmãs", f.siblings, "Nenhum irmão ou irmã registrado"),
      section("Avós", f.grandparents, "Nenhum avô ou avó registrado"),
      section("Netos e netas", f.grandchildren, "Nenhum neto ou neta registrado"),
      section("Tios e tias", f.auntsUncles, "Nenhum tio ou tia registrado"),
      section("Primos e primas", f.cousins, "Nenhum primo ou prima registrado"),
      section("Sobrinhos e sobrinhas", f.niecesNephews, "Nenhum sobrinho ou sobrinha registrado"),
      "**Pedidos de adoção recebidos**",
      adoptions.length ? adoptions.map(x => `• ${x.parentName} — <@${x.parentDiscordId}>`).join("\n") : "• Nenhum pedido pendente",
      "**Pedidos de casamento recebidos**",
      marriages.length ? marriages.map(x => `• ${x.name} — <@${x.discordId}>`).join("\n") : "• Nenhum pedido pendente",
      "A família considera os vínculos de adoção aceitos. Relacionamentos e adoções só começam com consentimento; qualquer uma das pessoas envolvidas pode encerrar."
    ].join("\n\n"));
  }
  if (command === "adotar") {
    const target = interaction.options.getUser("jogador");
    if (!validOther(target, interaction)) return interaction.reply({ content: "Escolha outro jogador que tenha personagem registrado. 🌸", ephemeral: true });
    if (!await repository.getPlayer(actorId)) return interaction.reply({ content: "Você precisa registrar seu personagem com !registrar antes de adotar.", ephemeral: true });
    if (!await repository.getPlayer(`discord:${target.id}`)) return interaction.reply({ content: "Essa pessoa ainda não registrou um personagem no RPG.", ephemeral: true });
    const result = await repository.createAdoptionRequest(actorId, `discord:${target.id}`);
    if (result !== "created") return interaction.reply({ content: "Já existe um pedido ou vínculo ativo entre vocês.", ephemeral: true });
    await interaction.reply({ content: `🌸 Pedido de adoção enviado para ${target}. Só será concluído quando a pessoa aceitar.`, ephemeral: true });
    await target.send(`🌸 ${interaction.user.username} enviou um pedido para ser seu responsável no Shinobi no Michi. Use /aceitar_adocao ou /recusar_adocao para responder. Qualquer um dos dois poderá encerrar o vínculo depois.`).catch(() => {});
    return;
  }
  if (command === "desertar") {
    const other = interaction.options.getUser("jogador");
    if (!validOther(other, interaction)) return interaction.reply({ content: "Selecione a outra pessoa envolvida na adoção.", ephemeral: true });
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import("discord.js");
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`family:desertar:confirm:${interaction.user.id}:${other.id}`).setLabel("Sim, desvincular").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`family:desertar:cancel:${interaction.user.id}:${other.id}`).setLabel("Não, voltar").setStyle(ButtonStyle.Secondary)
    );
    return interaction.reply({ content: `🌿 Você confirma que deseja encerrar o vínculo de adoção com ${other}? A árvore familiar será atualizada e o histórico será preservado.`, components: [row], ephemeral: true });
  }
  if (command === "cancelar_adocao") {
    const other = interaction.options.getUser("jogador");
    if (!validOther(other, interaction)) return interaction.reply({ content: "Selecione a outra pessoa envolvida na adoção.", ephemeral: true });
    const ok = await repository.cancelAdoption(actorId, `discord:${other.id}`);
    return interaction.reply({ content: ok ? "🌿 Pedido/vínculo de adoção encerrado. O histórico foi preservado." : "Não encontrei pedido pendente ou adoção ativa entre vocês.", ephemeral: true });
  }
  if (["aceitar_adocao", "recusar_adocao"].includes(command)) {
    const parent = interaction.options.getUser("responsavel");
    if (!validOther(parent, interaction)) return interaction.reply({ content: "Selecione quem enviou o pedido.", ephemeral: true });
    const parentId = `discord:${parent.id}`;
    const childPlayer = await repository.getPlayer(actorId);
    const parentPlayer = await repository.getPlayer(parentId);
    if (!childPlayer || !parentPlayer) return interaction.reply({ content: "Os dois jogadores precisam ter personagens registrados.", ephemeral: true });
    if (command === "recusar_adocao") {
      const ok = await repository.declineAdoptionRequest(parentId, actorId);
      return interaction.reply({ content: ok ? "Pedido de adoção recusado." : "Não encontrei um pedido pendente dessa pessoa.", ephemeral: true });
    }
    const result = await repository.acceptAdoptionRequest(parentId, actorId);
    if (result === "missing") return interaction.reply({ content: "Não encontrei um pedido pendente dessa pessoa.", ephemeral: true });
    if (result === "cycle") return interaction.reply({ content: "Esse vínculo criaria um ciclo na árvore familiar e não pode ser registrado.", ephemeral: true });
    if (result === "exists") return interaction.reply({ content: "Esse vínculo familiar já existe.", ephemeral: true });
    return interaction.reply({ content: `🌳 A adoção foi confirmada! ${parentPlayer.name} agora é responsável por ${childPlayer.name}.`, ephemeral: false });
  }
  if (command === "casar") {
    const target = interaction.options.getUser("jogador");
    if (!validOther(target, interaction)) return interaction.reply({ content: "Escolha outra pessoa para pedir em casamento.", ephemeral: true });
    if (!await repository.getPlayer(actorId) || !await repository.getPlayer(`discord:${target.id}`)) return interaction.reply({ content: "Os dois jogadores precisam ter personagens registrados.", ephemeral: true });
    const result = await repository.createMarriageRequest(actorId, `discord:${target.id}`);
    if (result === "married") return interaction.reply({ content: "Uma das pessoas já possui casamento ativo.", ephemeral: true });
    if (result !== "created") return interaction.reply({ content: "Já existe um pedido de casamento entre vocês.", ephemeral: true });
    await interaction.reply({ content: `💍 Pedido de casamento enviado para ${target}. O casamento só começa se a pessoa aceitar.`, ephemeral: true });
    await target.send(`💍 ${interaction.user.username} pediu você em casamento no Shinobi no Michi! Use /aceitar_casamento ou /recusar_casamento para responder. O casamento só começa com seu consentimento.`).catch(() => {});
    return;
  }
  if (["aceitar_casamento", "recusar_casamento"].includes(command)) {
    const proposer = interaction.options.getUser("pessoa");
    if (!validOther(proposer, interaction)) return interaction.reply({ content: "Selecione quem enviou o pedido.", ephemeral: true });
    const proposerId = `discord:${proposer.id}`;
    if (!await repository.getPlayer(actorId) || !await repository.getPlayer(proposerId)) return interaction.reply({ content: "Os dois jogadores precisam ter personagens registrados.", ephemeral: true });
    if (command === "recusar_casamento") {
      const ok = await repository.declineMarriageRequest(proposerId, actorId);
      return interaction.reply({ content: ok ? "Pedido de casamento recusado." : "Não encontrei um pedido pendente dessa pessoa.", ephemeral: true });
    }
    const result = await repository.acceptMarriageRequest(proposerId, actorId);
    if (result === "missing") return interaction.reply({ content: "Não encontrei um pedido pendente dessa pessoa.", ephemeral: true });
    if (result === "married") return interaction.reply({ content: "Uma das pessoas já possui casamento ativo.", ephemeral: true });
    return interaction.reply({ content: `💍 Casamento confirmado! ${interaction.user.username} e ${proposer.username} agora estão casados no Shinobi no Michi.`, ephemeral: false });
  }
  if (command === "cancelar_casamento") {
    const other = interaction.options.getUser("pessoa");
    if (!validOther(other, interaction)) return interaction.reply({ content: "Selecione a outra pessoa envolvida.", ephemeral: true });
    const ok = await repository.cancelMarriage(actorId, `discord:${other.id}`);
    return interaction.reply({ content: ok ? "💔 Casamento/pedido encerrado. O histórico foi preservado." : "Não encontrei casamento ativo ou pedido pendente entre vocês.", ephemeral: true });
  }
}
