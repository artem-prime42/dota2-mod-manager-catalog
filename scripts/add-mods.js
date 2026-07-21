const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '..', 'catalog.json');
const raw = fs.readFileSync(file, 'utf8');
const data = JSON.parse(raw);
if (!data.mods || !data.mods.modsData || !Array.isArray(data.mods.modsData.heroes)) {
  console.error('Unexpected catalog structure');
  process.exit(1);
}
const heroes = data.mods.modsData.heroes;

const newMods = [
  {
    name: "Phantom lancer rich",
    author: "Dota2VPK",
    preview: "https://i.postimg.cc/m2tGWCrJ/photo-2026-07-21-18-27-49.jpg",
    file: "https://github.com/artem-prime42/dota2-mods/releases/download/272/Phantom.lancer.rich.zip",
    createdAt: "2026-07-21T00:00:00.000Z",
    categoryId: "heroes",
    hero: "phantom_lancer",
    heroLabel: "Phantom Lancer",
    slot: "set"
  },
  {
    name: "Axe Immortal Set",
    author: "Arthas",
    preview: "https://i.postimg.cc/Qdhwx78y/photo-2026-07-21-18-31-06.jpg",
    file: "https://github.com/artem-prime42/dota2-mods/releases/download/272/Axe.Immortal.Set.zip",
    createdAt: "2026-07-21T00:00:00.000Z",
    categoryId: "heroes",
    hero: "axe",
    heroLabel: "Axe",
    slot: "set"
  },
  {
    name: "arcana vengeful spirit - pedestal",
    author: "XIIIpsiblade",
    preview: "https://i.postimg.cc/d115ZRgK/photo-2026-07-21-18-29-45.jpg",
    file: "https://github.com/artem-prime42/dota2-mods/releases/download/272/arcana.vengeful.spirit.-.pedestal.zip",
    createdAt: "2026-07-21T00:00:00.000Z",
    categoryId: "heroes",
    hero: "vengeful_spirit",
    heroLabel: "Vengeful Spirit",
    slot: "pedestal"
  }
];

for (const mod of newMods) {
  // avoid duplicates by file
  if (!heroes.find((m) => m.file === mod.file)) {
    heroes.push(mod);
    console.log('Added', mod.name);
  } else {
    console.log('Skipped existing', mod.name);
  }
}

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log('catalog.json updated');
