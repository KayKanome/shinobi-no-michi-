export const ATTRIBUTE_LABELS = {
  forca: "Força",
  agilidade: "Agilidade",
  vitalidade: "Vitalidade",
  inteligencia: "Inteligência",
  percepcao: "Percepção",
  controleChakra: "Controle de Chakra"
};

export function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export function rollDie(sides, random = Math.random) {
  if (!Number.isInteger(sides) || sides < 2) throw new Error("Dado inválido.");
  return Math.floor(random() * sides) + 1;
}

export function roll2d8(modifier = 0, random = Math.random) {
  const first = rollDie(8, random);
  const second = rollDie(8, random);
  return { dice: [first, second], modifier, total: first + second + modifier };
}

export function resolveCheck({ attributeValue = 0, difficulty = 15, random = Math.random }) {
  const result = roll2d8(attributeValue, random);
  return {
    ...result,
    difficulty,
    success: result.total >= difficulty,
    margin: result.total - difficulty
  };
}

export function formatCheck(result, attributeName = "Atributo") {
  const outcome = result.success ? "SUCESSO" : "FALHA";
  const dice = result.dice.join(" + ");
  const bonus = result.modifier >= 0 ? ` + ${result.modifier}` : ` - ${Math.abs(result.modifier)}`;
  return `🎲 **Teste de ${attributeName}: ${outcome}**\\nRolagem: 2d8 (${dice})${bonus} = **${result.total}**\\nDificuldade: **${result.difficulty}**`;
}
