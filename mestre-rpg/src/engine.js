export const ATTRIBUTE_LABELS = {
  forca: "Força", agilidade: "Agilidade", vitalidade: "Vitalidade",
  inteligencia: "Inteligência", percepcao: "Percepção", controleChakra: "Controle de Chakra"
};
export function normalize(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}
export function rollDie(sides, random = Math.random) {
  if (!Number.isInteger(sides) || sides < 2) throw new Error("Dado inválido.");
  return Math.floor(random() * sides) + 1;
}
export function roll2d8(modifier = 0, random = Math.random) {
  const dice = [rollDie(8, random), rollDie(8, random)];
  return { dice, modifier, total: dice[0] + dice[1] + modifier };
}
export function resolveCheck({ attributeValue = 0, difficulty = 15, random = Math.random }) {
  const result = roll2d8(attributeValue, random);
  return { ...result, difficulty, success: result.total >= difficulty, margin: result.total - difficulty };
}
export function formatCheck(result, attributeName = "Atributo") {
  const outcome = result.success ? "SUCESSO" : "FALHA";
  const bonus = result.modifier >= 0 ? " + " + result.modifier : " - " + Math.abs(result.modifier);
  return "🎲 **Teste de " + attributeName + ": " + outcome + "**\nRolagem: 2d8 (" + result.dice.join(" + ") + ")" + bonus + " = **" + result.total + "**\nDificuldade: **" + result.difficulty + "**";
}
