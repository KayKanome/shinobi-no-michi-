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
  const commands = ["rpg", "estilo", "clan", "cla", "atributos", "distribuir", "marionete", "companheiro", "batalha"];
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
    "• !batalha — regras e comandos de combate",
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

  if (command === "batalha") {
    const sub = normalize(args[0] ?? "");
    const mention = raw.match(/<@!?(\d+)>/);
    const targetId = mention ? "discord:" + mention[1] : null;
    const active = player.battle;
    const saveBoth = async (a, b, state) => {
      a.battle = structuredClone(state); b.battle = structuredClone(state);
      await repository.savePlayer(a); await repository.savePlayer(b);
    };
    if (!sub || sub === "ajuda") return [
      "*ARENA SHINOBI — BATALHA POR TURNOS*",
      "Desafiar: !batalha desafiar @jogador",
      "Aceitar/recusar: !batalha aceitar | !batalha recusar",
      "Ações: !batalha atacar | !batalha tecnica nome | !batalha defender | !batalha concentrar",
      "Consultar: !batalha status | Desistir: !batalha desistir",
      "A Momoka resolve os testes automaticamente; atributos e estilo influenciam os resultados."
    ].join("\n");
    if (sub === "desafiar") {
      if (!targetId) return "Marque o adversário: !batalha desafiar @jogador.";
      if (targetId === from) return "Você não pode desafiar a si mesmo.";
      const other = await repository.getPlayer(targetId);
      if (!other) return "Esse jogador ainda não criou uma ficha com !registrar Nome.";
      if (["active","pending"].includes(active?.status) || ["active","pending"].includes(other.battle?.status)) return "Um dos jogadores já está ocupado em outra batalha.";
      await saveBoth(player, other, {status:"pending", challenger:from, target:targetId});
      return "⚔️ " + player.name + " desafiou " + other.name + "! " + other.name + ", envie !batalha aceitar ou !batalha recusar.";
    }
    if (sub === "aceitar" || sub === "recusar") {
      if (!active || active.status !== "pending" || active.target !== from) return "Você não tem desafio pendente.";
      const other = await repository.getPlayer(active.challenger);
      if (!other) return "O desafiante não foi encontrado.";
      if (sub === "recusar") {
        player.battle = null; other.battle = null;
        await repository.savePlayer(player); await repository.savePlayer(other);
        return "Desafio recusado.";
      }
      const fighters = {};
      for (const p of [other, player]) fighters[p.id] = {
        hp: 100 + Number(p.attributes?.vitalidade ?? 1) * 10,
        maxHp: 100 + Number(p.attributes?.vitalidade ?? 1) * 10,
        chakra: Number(p.chakra ?? 100), maxChakra: Number(p.maxChakra ?? 100), guarding:false
      };
      const initiative = p => Number(p.attributes?.agilidade ?? 1) + Math.floor(Math.random()*20)+1;
      const first = initiative(other) >= initiative(player) ? other.id : player.id;
      const state = {status:"active", challenger:other.id, target:player.id, combat:{fighters,turn:first,round:1}};
      await saveBoth(other, player, state);
      return "⚔️ BATALHA INICIADA: " + other.name + " VS " + player.name + ". Primeiro turno: " + (first === other.id ? other.name : player.name) + ".";
    }
    if (sub === "status") {
      if (!active) return "Você não está em uma batalha.";
      if (active.status === "pending") return "Há um desafio pendente. Use !batalha aceitar ou !batalha recusar.";
      if (!active.combat) return "A batalha foi encerrada.";
      const c = active.combat;
      return ["*BATALHA — RODADA " + c.round + "*",
        "Você: HP " + c.fighters[from].hp + "/" + c.fighters[from].maxHp + " | Chakra " + c.fighters[from].chakra + "/" + c.fighters[from].maxChakra,
        "Adversário: HP " + c.fighters[active.challenger === from ? active.target : active.challenger].hp + "/" + c.fighters[active.challenger === from ? active.target : active.challenger].maxHp,
        "Turno: " + (c.turn === from ? "seu" : "adversário")].join("\n");
    }
    if (sub === "desistir") {
      if (!active || active.status !== "active") return "Você não está em batalha ativa.";
      const otherId = active.challenger === from ? active.target : active.challenger;
      const other = await repository.getPlayer(otherId);
      const ended = {...active,status:"finished",winner:otherId};
      player.battle = structuredClone(ended); await repository.savePlayer(player);
      if (other) {other.battle=structuredClone(ended); await repository.savePlayer(other);}
      return player.name + " desistiu. " + (other?.name ?? "O adversário") + " venceu.";
    }
    if (!active || active.status !== "active" || !active.combat) return "Você não está em batalha. Use !batalha desafiar @jogador.";
    const otherId = active.challenger === from ? active.target : active.challenger;
    const other = await repository.getPlayer(otherId);
    if (!other) return "Não consegui localizar o adversário.";
    const c = structuredClone(active.combat);
    if (c.turn !== from) return "Ainda não é seu turno. Consulte !batalha status.";
    const me = c.fighters[from], foe = c.fighters[otherId];
    const roll = () => Math.floor(Math.random()*20)+1;
    let result = "";
    if (sub === "atacar") {
      const hit = roll()+Number(player.attributes?.forca??1)+Number(player.attributes?.agilidade??1) >= roll()+Number(other.attributes?.agilidade??1)+Number(other.attributes?.percepcao??1);
      if (hit) {
        let damage = 10+Number(player.attributes?.forca??1)*2+Math.floor(Math.random()*6);
        if (foe.guarding) damage=Math.ceil(damage/2);
        foe.hp=Math.max(0,foe.hp-damage); foe.guarding=false;
        result="Ataque acertou e causou "+damage+" de dano.";
      } else {foe.guarding=false; result="O adversário evitou seu ataque.";}
    } else if (sub === "defender") {
      me.guarding=true; result="Você se defendeu; o próximo dano recebido será reduzido pela metade.";
    } else if (sub === "concentrar") {
      const amount=Math.min(20,me.maxChakra-me.chakra); me.chakra+=amount;
      result="Você recuperou "+amount+" de Chakra.";
    } else if (sub === "tecnica") {
      const name=normalize(args.slice(1).join(" "));
      const catalog={
        ninjutsu:[["bola de fogo",20,25],["rajada de chakra",15,19]],
        genjutsu:[["ilusao",18,22],["confusao",15,18]],
        taijutsu:[["combo",12,24],["golpe preciso",10,18]],
        medico:[["bisturi de chakra",18,20],["pulso curativo",20,0]],
        marionetista:[["ataque da marionete",16,23],["manobra defensiva",14,0]],
        armamentos:[["chuva de ferramentas",16,23],["arremesso preciso",12,19]]
      };
      const list=catalog[player.style]??[];
      const technique=list.find(t=>normalize(t[0])===name);
      if (!technique) return "Técnicas disponíveis: "+(list.map(t=>t[0]).join(", ")||"escolha um estilo com !estilo")+".";
      if (me.chakra<technique[1]) return "Chakra insuficiente. Custo: "+technique[1]+".";
      me.chakra-=technique[1];
      if (player.style==="medico" && name==="pulso curativo") {
        const heal=Math.min(24,me.maxHp-me.hp); me.hp+=heal; result="Pulso Curativo recuperou "+heal+" HP.";
      } else if (player.style==="marionetista" && name==="manobra defensiva") {
        me.guarding=true; result="Sua marionete reforçou sua defesa.";
      } else {
        const bonus=Number(player.attributes?.inteligencia??1)+Number(player.attributes?.controleChakra??1);
        const hit=roll()+bonus>=roll()+Number(other.attributes?.agilidade??1)+Number(other.attributes?.percepcao??1);
        if (hit) {
          let damage=technique[2]+Math.floor(bonus/2)+Math.floor(Math.random()*6);
          if (foe.guarding) damage=Math.ceil(damage/2);
          foe.hp=Math.max(0,foe.hp-damage); foe.guarding=false;
          result=technique[0]+" acertou e causou "+damage+" de dano.";
        } else {foe.guarding=false; result=technique[0]+" não acertou.";}
      }
    } else return "Ação inválida. Use atacar, tecnica nome, defender, concentrar, status ou desistir.";
    if (foe.hp<=0) {
      const ended={...active,status:"finished",winner:from,combat:c};
      player.chakra=me.chakra; other.chakra=foe.chakra;
      await saveBoth(player,other,ended);
      return "🏆 "+player.name+" venceu a batalha! "+result;
    }
    c.turn=otherId; if (otherId===active.challenger) c.round+=1;
    await saveBoth(player,other,{...active,combat:c});
    return result+" Agora é o turno de "+other.name+".";
  }

  return null;
}
