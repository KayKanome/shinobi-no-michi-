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

test("style bonus is +3 primary and +1 secondary", () => {
  const character = { primary_style: "Ninjutsu", secondary_style: "Genjutsu" };
  assert.equal(getSkillBonus(character, "ninjutsu"), 3);
  assert.equal(getSkillBonus(character, "genjutsu"), 1);
  assert.equal(getSkillBonus(character, "taijutsu"), 0);
});

test("Uchiha clan bonuses are applied only to matching skills", () => {
  const character = { clan: "Uchiha" };
  assert.equal(getClanBonus(character, "genjutsu"), 1);
  assert.equal(getClanBonus(character, "resistenciaMental"), 2);
  assert.equal(getClanBonus(character, "ninjutsu"), 0);
});

test("all skill definitions point to a known attribute", () => {
  const attributes = new Set(["forca", "agilidade", "vitalidade", "inteligencia", "percepcao", "controleChakra"]);
  for (const skill of Object.values(SKILLS)) assert.ok(attributes.has(skill.attribute));
});
