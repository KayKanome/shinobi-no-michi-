import test from "node:test";
import assert from "node:assert/strict";
import { normalize, rollDie, resolveCheck, getSkillBonus, getClanBonus, SKILLS } from "./engine.js";

test("normalize removes accents and normalizes case", () => {
  assert.equal(normalize("Hyūga"), "hyuga");
  assert.equal(normalize("  CONTROLE DE CHAKRA "), "controle de chakra");
});

test("rollDie returns an integer inside die bounds", () => {
  assert.equal(rollDie(6, () => 0), 1);
  assert.equal(rollDie(6, () => 0.999999), 6);
  assert.throws(() => rollDie(1), /Dado inválido/);
});

test("resolveCheck adds die, attribute and bonuses", () => {
  const result = resolveCheck({ attributeValue: 3, skillBonus: 2, clanBonus: 1, difficulty: 15, random: () => 0.5 });
  assert.equal(result.die, 11);
  assert.equal(result.total, 17);
  assert.equal(result.success, true);
});

test("only the single main specialization grants +3; other areas remain usable without specialization bonus", () => {
  const character = { primary_style: "Ninjutsu" };
  assert.equal(getSkillBonus(character, "ninjutsu"), 3);
  assert.equal(getSkillBonus(character, "genjutsu"), 0);
  assert.equal(getSkillBonus(character, "taijutsu"), 0);
});

test("each clan receives only its defined +2/+1 bonuses", () => {
  const cases = [
    ["Uchiha", "genjutsu", 1, "resistenciaMental", 2],
    ["Hyūga", "percepcao", 2, "controleChakra", 1],
    ["Inuzuka", "sobrevivencia", 2, "percepcao", 1],
    ["Nara", "investigacao", 2, "furtividade", 1],
    ["Akimichi", "taijutsu", 2, "resistenciaMental", 1],
    ["Aburame", "furtividade", 2, "investigacao", 1]
  ];
  for (const [clan, skillA, bonusA, skillB, bonusB] of cases) {
    assert.equal(getClanBonus({ clan }, skillA), bonusA, clan + " " + skillA);
    assert.equal(getClanBonus({ clan }, skillB), bonusB, clan + " " + skillB);
    assert.equal(getClanBonus({ clan }, "ninjutsu"), 0, clan + " unrelated skill");
  }
  assert.equal(getClanBonus({ clan: "Sem clã" }, "percepcao"), 0);
});

test("all skill definitions point to a known attribute", () => {
  const attributes = new Set(["forca", "agilidade", "vitalidade", "inteligencia", "percepcao", "controleChakra"]);
  for (const skill of Object.values(SKILLS)) assert.ok(attributes.has(skill.attribute));
});
