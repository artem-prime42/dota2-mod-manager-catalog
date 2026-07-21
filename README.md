# Public catalog repo for Dota 2 Mod Manager

This repository is a standalone `catalog.json` source for the desktop launcher.
Publish it as a public GitHub repository and point the manager at the raw JSON URL.

## How to use

1. Push this folder to GitHub, for example:
   `https://github.com/<your-user>/dota2-mod-manager-catalog`
2. Set the launcher environment variable:

```bash
DOTA2SKINS_CATALOG_URL=https://raw.githubusercontent.com/<your-user>/dota2-mod-manager-catalog/main/catalog.json
```

3. Run the desktop app. It will fetch the catalog from the public repository.

## Supported schema

The launcher expects a JSON object with these top-level keys:

- `mods.modsData` — category map with arrays of mod objects
- `mods.recentlyAddedMods` — list of newest mods
- `constants.categories` — category metadata
- `constants.HEROES_LIST` — hero names array
- `constants.HERO_CATALOG` — hero catalog metadata
- `constants.TAG_CONFIGS` — optional tag settings
- `constants.MOD_AUTHOR` — optional author lookup
- `constants.MOD_SENDER` — optional sender lookup
- `constants.AUTHOR_PROFILES` — author profiles list
- `guides` — optional help/guide content

## Example

The sample `catalog.json` in this repo contains a minimal example for one hero mod and one author.
Replace it with your real catalog data structure before pushing.
