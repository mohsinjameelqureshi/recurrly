import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createBrandIconMatcher } from "../src/lib/brandIconMatcher.ts";

const catalogue = JSON.parse(
  readFileSync(
    new URL("../src/constants/brand-icons.json", import.meta.url),
    "utf8",
  ),
);
const match = createBrandIconMatcher(Object.keys(catalogue.icons));

test("requested services match compact logos, including the Spotify typo", () => {
  for (const [name, slug] of [
    ["Spotify", "spotify-icon"],
    ["spoitify", "spotify-icon"],
    ["NETFLIX", "netflix-icon"],
    ["Linked In Premium", "linkedin-icon"],
    ["Google", "google-icon"],
  ])
    assert.equal(match(name), slug);
});

test("service names handle plan suffixes, punctuation, and common aliases", () => {
  for (const [name, slug] of [
    [" Spotify Premium Family Plan ", "spotify-icon"],
    ["Google One", "google-one"],
    ["Google Plus", "google-plus"],
    ["Google Drive", "google-drive"],
    ["ChatGPT Plus", "openai-icon"],
    ["GitHub Pro", "github-icon"],
    ["Adobe Photoshop", "adobe-photoshop"],
  ])
    assert.equal(match(name), slug);
});

test("unknown and empty names have no brand match", () => {
  for (const name of [
    "",
    "  ",
    "My private subscription",
    "Not Netflix",
    "Spotify clone",
  ])
    assert.equal(match(name), undefined);
});

test("all matched symbols have valid artwork and dimensions", () => {
  assert.ok(Object.keys(catalogue.icons).length > 2000);
  for (const icon of Object.values(catalogue.icons)) {
    assert.ok(icon.body.length > 0);
    assert.ok((icon.width ?? catalogue.width) > 0);
    assert.ok((icon.height ?? catalogue.height) > 0);
  }
});
