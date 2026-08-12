#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const GITHUB_RELEASE_URL_RE = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/releases\/download\/([^/]+)\/(.+)$/i;

function parseGithubReleaseAssetUrl(value) {
  if (!value || typeof value !== 'string') return null;
  const match = value.match(GITHUB_RELEASE_URL_RE);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2],
    tag: match[3],
    asset: decodeURIComponent(match[4]),
  };
}

function parseGithubLinkHeader(linkHeader) {
  if (!linkHeader || typeof linkHeader !== 'string') return {};
  return linkHeader.split(',').reduce((acc, part) => {
    const [urlPart, relPart] = part.split(';').map((item) => item.trim());
    const relMatch = relPart && relPart.match(/rel="(.+)"/);
    if (urlPart && relMatch) {
      const url = urlPart.replace(/^<|>$/g, '');
      acc[relMatch[1]] = url;
    }
    return acc;
  }, {});
}

function collectMods(modsData) {
  const mods = [];
  if (!modsData || typeof modsData !== 'object') return mods;

  for (const group of Object.values(modsData)) {
    if (Array.isArray(group)) {
      mods.push(...group);
    } else if (group && Array.isArray(group.groups)) {
      for (const subGroup of group.groups) {
        if (Array.isArray(subGroup.mods)) {
          mods.push(...subGroup.mods);
        }
      }
    }
  }

  return mods;
}

async function fetchGithubReleases(owner, repo, token) {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'dota2-mod-manager-catalog-updater',
  };
  if (token) headers.Authorization = `token ${token}`;

  const releases = [];
  let page = 1;
  let nextUrl = `https://api.github.com/repos/${owner}/${repo}/releases?per_page=100&page=${page}`;

  while (nextUrl) {
    const res = await fetch(nextUrl, { headers });
    if (!res.ok) {
      throw new Error(`GitHub API failed for ${owner}/${repo}: HTTP ${res.status}`);
    }
    const pageReleases = await res.json();
    if (!Array.isArray(pageReleases)) break;
    releases.push(...pageReleases);

    const link = res.headers.get('link');
    const parsedLinks = parseGithubLinkHeader(link);
    nextUrl = parsedLinks.next || null;
    if (nextUrl && page >= 10) break;
    page += 1;
  }

  return releases;
}

async function enrichPayloadWithDownloads(payload, token) {
  if (!payload || !payload.mods || !payload.mods.modsData) return payload;

  const mods = collectMods(payload.mods.modsData);
  const repoResources = new Map();

  for (const mod of mods) {
    const candidates = [mod.file, mod.downloadUrl, mod.download_url, mod.url, mod.source, mod.repo].filter(Boolean);
    for (const candidate of candidates) {
      const parsed = parseGithubReleaseAssetUrl(candidate);
      if (!parsed) continue;
      const repoKey = `${parsed.owner}/${parsed.repo}`;
      if (!repoResources.has(repoKey)) repoResources.set(repoKey, new Map());
      repoResources.get(repoKey).set(`${parsed.tag}|${parsed.asset}`, { mod });
      break;
    }
  }

  if (!repoResources.size) return payload;

  for (const [repoKey, assets] of repoResources.entries()) {
    const [owner, repo] = repoKey.split('/');
    let releases;
    try {
      releases = await fetchGithubReleases(owner, repo, token);
    } catch (err) {
      console.warn(`Skipping ${repoKey}: ${err.message || err}`);
      continue;
    }

    const assetCounts = new Map();
    for (const release of releases) {
      if (!release || !Array.isArray(release.assets)) continue;
      for (const asset of release.assets) {
        if (!asset || !asset.name) continue;
        assetCounts.set(`${release.tag_name}|${asset.name}`, asset.download_count || 0);
      }
    }

    for (const [releaseKey, data] of assets.entries()) {
      const count = assetCounts.get(releaseKey);
      if (Number.isFinite(count)) {
        data.mod.downloads = count;
      }
    }
  }

  return payload;
}

async function main() {
  const catalogPath = path.resolve(process.argv[2] || 'catalog.json');
  const token = process.env.GITHUB_TOKEN || null;

  const raw = fs.readFileSync(catalogPath, 'utf-8');
  const payload = JSON.parse(raw);
  const updated = await enrichPayloadWithDownloads(payload, token);

  fs.writeFileSync(catalogPath, JSON.stringify(updated, null, 2) + '\n', 'utf-8');
  console.log(`Updated download counts in ${catalogPath}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
