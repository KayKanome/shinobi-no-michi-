const STYLES = {
  ninjutsu: "Ninjutsu",
  genjutsu: "Genjutsu",
  taijutsu: "Taijutsu",
  medico: "Médico",
  marionetista: "Marionetista",
  armamentos: "Especialista em Armamentos"
};
const CLANS = ["Sem clã", "Uchiha", "Hyūga", "Inuzuka", "Nara", "Akimichi", "Aburame"];
const ATTRIBUTES = {
  forca: "Força",
  agilidade: "Agilidade",
  vitalidade: "Vitalidade",
  inteligencia: "Inteligência",
  percepcao: "Percepção",
  controlechakra: "Controle de Chakra"
};
const normalize = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const ensureRpg = player => {
  player.attributes ??= { forca: 1, agilidade: 1, vitalidade: 1, inteligencia: 1, percepcao: 1, controleChakra: 1 };
  player.attributePoints = Number(player.attributePoints ?? 4);
  player.style ??= null;
  player.clan ??= "Sem clã";
  player.puppet ??= null;
  player.companion ??= null;
};
const attributeKey = input => Object.keys(ATTRIBUTES).find(key => normalize(key) === normalize(input) || normalize(ATTRIBUTES[key]) === normalize(input));

export async function handleRpgCommand({ from, text, repository }) {
  const raw = String(text ?? "").trim();
  if (!raw.startsWith("!")) return null;
  const [rawCommand, ...args] = raw.slice(1).split(/\s+/);
  const command = normalize(rawCommand);
  const player = await repository.getPlayer(from);
  const commands = ["rpg", "estilo", "clan", "cla", "atributos", "distribuir", "marionete", "companheiro"];
  if (!commands.includes(command)) return null;
  if (!player) return "Você ainda não tem ficha. Crie uma com !registrar SeuNome.";
  ensureRpg(player);

  if (command === "rpg") return [
    "*SHINOBI NO MICHI — SISTEMA RPG (TESTE)*",
    "• !estilo — ver estilos ou escolher um",
    "• !clan — ver clãs ou escolher um",
    "• !atributos — consultar seus atributos e pontos",
    "• !distribuir atributo quantidade — gastar pontos",
    "• !marionete nome — criar sua marionete (estilo Marionetista)",
    "• !companheiro nome — criar companheiro (clã Inuzuka)",
    "",
    "No teste, as escolhas são livres. No lançamento, clãs e especializações poderão ser obtidos por rolagem com raridades e limites."
  ].join("\n");

  if (command === "estilo") {
    if (!args.length) return ["*ESTILOS DISPONÍVEIS*", ...Object.entries(STYLES).map(([key, label]) => `• ${label} — !estilo ${key}`), "", `Seu estilo atual: **${player.style ? STYLES[player.style] : "Não escolhido"}**`].join("\n");
    const selected = normalize(args.join(" "));
    const key = Object.keys(STYLES).find(item => normalize(item) === selected || normalize(STYLES[item]) === selected);
    if (!key) return "Estilo não encontrado. Envie !estilo para ver as opções.";
    if (player.style && player.style !== key) return `Seu estilo principal já é **${STYLES[player.style]}**. Durante o teste, peça a Momoka para reiniciar sua ficha se quiser experimentar outro.`;
    player.style = key;
    await repository.savePlayer(player);
    return `Estilo principal definido: **${STYLES[key]}**. Você ainda pode usar recursos comuns dos outros estilos; seu estilo principal concede vantagens próprias.`;
  }

  if (command === "clan" || command === "cla") {
    if (!args.length) return [`*CLÃS DISPONÍVEIS*`, ...CLANS.map(name => `• ${name}`), "", `Seu clã atual: **${player.clan}**`, "Escolha com !clan nome."].join("\n");
    const selected = args.join(" ");
    const clan = CLANS.find(name => normalize(name) === normalize(selected));
    if (!clan) return "Clã não encontrado. Envie !clan para consultar as opções.";
    if (player.clan !== "Sem clã" && player.clan !== clan) return `Seu clã já é **${player.clan}**. Para trocar durante o teste, reinicie a ficha.`;
    player.clan = clan;
    await repository.savePlayer(player);
    const detail = clan === "Uchiha" ? "Afinidade com técnicas visuais e genjutsu, com evolução gradual." :
      clan === "Hyūga" ? "Percepção ampliada e leitura do fluxo de chakra, desbloqueadas por progressão." :
      clan === "Inuzuka" ? "Permite criar um companheiro canino e desenvolver vínculo com ele." :
      clan === "Nara" ? "Afinidade estratégica e técnicas de controle." :
      clan === "Akimichi" ? "Técnicas de resistência e suporte físico." :
      clan === "Aburame" ? "Companheiros insetos e técnicas de rastreamento fictício." : "Você seguirá sem habilidade hereditária.";
    return `Clã escolhido: **${clan}**. ${detail}`;
  }

  if (command === "atributos") {
    return ["*SEUS ATRIBUTOS*", ...Object.entries(ATTRIBUTES).map(([key, label]) => `${label}: **${player.attributes[key] ?? player.attributes[key === "controlechakra" ? "controleChakra" : key] ?? 1}**`), "", `Pontos disponíveis: **${player.attributePoints}**`, "Cada nível conquistado concede +1 ponto. Use !distribuir atributo quantidade."].join("\n");
  }

  if (command === "distribuir") {
    if (args.length !== 2 || !/^\d+$/.test(args[1])) return "Use: !distribuir atributo quantidade. Exemplo: !distribuir percepcao 2.";
    const key = attributeKey(args[0]);
    const amount = Number(args[1]);
    if (!key) return "Atributo inválido. Consulte !atributos.";
    if (amount < 1 || amount > player.attributePoints) return `Você tem apenas ${player.attributePoints} ponto(s) disponível(is).`;
    const storageKey = key === "controlechakra" ? "controleChakra" : key;
    const current = Number(player.attributes[storageKey] ?? 1);
    if (current + amount > 10) return "Durante o teste, cada atributo tem limite 10.";
    player.attributes[storageKey] = current + amount;
    player.attributePoints -= amount;
    await repository.savePlayer(player);
    return `**${ATTRIBUTES[key]}** aumentou de ${current} para ${current + amount}. Pontos restantes: ${player.attributePoints}.`;
  }

  if (command === "marionete") {
    if (player.style !== "marionetista") return "A criação de marionetes exige o estilo principal Marionetista. Escolha com !estilo marionetista.";
    const name = args.join(" ").trim();
    if (name.length < 2 || name.length > 24) return "Informe um nome de 2 a 24 caracteres. Exemplo: !marionete Karasu.";
    if (player.puppet) return `Você já possui a marionete **${player.puppet.name}**. A ficha de teste permite uma marionete inicial.`;
    player.puppet = { name, level: 1, integrity: 100, slots: 2, heat: 0 };
    await repository.savePlayer(player);
    return `Marionete **${name}** cadastrada! Nv. 1, 100 de integridade e 2 espaços de suporte. A personalização de imagem e equipamentos será adicionada em uma etapa própria.`;
  }

  if (command === "companheiro") {
    if (player.clan !== "Inuzuka") return "O companheiro canino inicial exige o clã Inuzuka.";
    const name = args.join(" ").trim();
    if (name.length < 2 || name.length > 24) return "Informe um nome de 2 a 24 caracteres. Exemplo: !companheiro Akamaru.";
    if (player.companion) return `Seu companheiro já se chama **${player.companion.name}**.`;
    player.companion = { name, level: 1, bond: 0, hunger: 50, mood: 100 };
    await repository.savePlayer(player);
    return `**${name}** agora é seu companheiro! Vínculo: 0, nível 1. Cuidados e atividades de vínculo serão desenvolvidos na próxima etapa.`;
  }
  return null;
}
