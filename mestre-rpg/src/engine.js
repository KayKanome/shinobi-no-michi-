export const ATTRIBUTE_LABELS = {
  forca: "Força", agilidade: "Agilidade", vitalidade: "Vitalidade",
  inteligencia: "Inteligência", percepcao: "Percepção", controleChakra: "Controle de Chakra"
};
export const STYLES = ["Ninjutsu", "Genjutsu", "Taijutsu", "Médico", "Marionetista", "Especialista em Armamentos"];
export const CLANS = ["Sem clã", "Uchiha", "Hyūga", "Inuzuka", "Nara", "Akimichi", "Aburame"];
export const SKILLS = {
  ninjutsu: { label: "Ninjutsu", attribute: "inteligencia", style: "Ninjutsu" },
  genjutsu: { label: "Genjutsu", attribute: "inteligencia", style: "Genjutsu" },
  taijutsu: { label: "Taijutsu", attribute: "forca", style: "Taijutsu" },
  furtividade: { label: "Furtividade", attribute: "agilidade" },
  investigacao: { label: "Investigação", attribute: "inteligencia" },
  percepcao: { label: "Percepção", attribute: "percepcao" },
  sobrevivencia: { label: "Sobrevivência", attribute: "percepcao" },
  medicina: { label: "Medicina", attribute: "inteligencia", style: "Médico" },
  resistenciaMental: { label: "Resistência Mental", attribute: "vitalidade" },
  controleChakra: { label: "Controle de Chakra", attribute: "controleChakra" },
  armamentos: { label: "Armamentos", attribute: "agilidade", style: "Especialista em Armamentos" },
  marionetes: { label: "Marionetes", attribute: "inteligencia", style: "Marionetista" }
};
export function normalize(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}
export function rollDie(sides, random = Math.random) {
  if (!Number.isInteger(sides) || sides < 2) throw new Error("Dado inválido.");
  return Math.floor(random() * sides) + 1;
}
export function resolveCheck({ attributeValue = 0, skillBonus = 0, clanBonus = 0, difficulty = 15, random = Math.random }) {
  const die = rollDie(20, random);
  const total = die + Number(attributeValue) + Number(skillBonus) + Number(clanBonus);
  return { die, attributeValue: Number(attributeValue), skillBonus: Number(skillBonus), clanBonus: Number(clanBonus), total, difficulty, success: total >= difficulty, margin: total - difficulty };
}
export function getSkillBonus(character, skillKey) {
  const skill = SKILLS[skillKey];
  if (!skill || !skill.style) return 0;
  if (normalize(character.primary_style) === normalize(skill.style)) return 3;
  return 0;
}
export function getClanBonus(character, skillKey) {
  if (normalize(character.clan) === "uchiha") {
    if (skillKey === "genjutsu") return 1;
    if (skillKey === "resistenciaMental") return 2;
  }
  return 0;
}
export function formatCheck(result, skillName = "Teste") {
  const outcome = result.success ? "SUCESSO" : "FALHA";
  const parts = ["1d20 (" + result.die + ")", "atributo +" + result.attributeValue];
  if (result.skillBonus) parts.push("estilo +" + result.skillBonus);
  if (result.clanBonus) parts.push("clã +" + result.clanBonus);
  return "🎲 **" + skillName + ": " + outcome + "**\nRolagem: " + parts.join(" · ") + " = **" + result.total + "**\nDificuldade: **" + result.difficulty + "**";
}
