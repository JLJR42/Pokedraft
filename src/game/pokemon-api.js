import { POKEMON_POOL } from './pokemon.js';

const INDEX_URL = 'https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0';
const INDEX_CACHE_KEY = 'pokedraft-pokemon-index-v1';
const DETAIL_CACHE_KEY = 'pokedraft-pokemon-details-v1';
const REQUEST_TIMEOUT_MS = 8000;

const readCache = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const writeCache = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage is optional. */ }
};
const slugify = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function getJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`PokéAPI returned ${response.status}.`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function loadPokemonIndex() {
  const cached = readCache(INDEX_CACHE_KEY, null);
  if (cached?.length) return cached;
  try {
    const result = await getJson(INDEX_URL);
    const index = result.results.map(({ name, url }) => ({ name, apiUrl: url, types: [], ability: 'Details loading', stats: [] }));
    writeCache(INDEX_CACHE_KEY, index);
    return index;
  } catch {
    return POKEMON_POOL;
  }
}

export async function hydratePokemon(pokemonList) {
  const detailCache = readCache(DETAIL_CACHE_KEY, {});
  const hydrated = await Promise.all(pokemonList.map(async (pokemon) => {
    if (!pokemon.apiUrl) return pokemon;
    if (detailCache[pokemon.name]) return detailCache[pokemon.name];
    try {
      const detail = await getJson(pokemon.apiUrl);
      const hydratedPokemon = {
        name: detail.name,
        apiUrl: pokemon.apiUrl,
        types: detail.types.sort((left, right) => left.slot - right.slot).map(({ type }) => type.name.replace(/-/g, ' ')),
        ability: detail.abilities.map(({ ability, is_hidden }) => `${ability.name.replace(/-/g, ' ')}${is_hidden ? ' (hidden)' : ''}`).join(', '),
        stats: detail.stats.map(({ base_stat, stat }) => ({ name: stat.name, value: base_stat })),
        pokedexUrl: `https://pokemondb.net/pokedex/${slugify(detail.name)}`
      };
      detailCache[pokemon.name] = hydratedPokemon;
      writeCache(DETAIL_CACHE_KEY, detailCache);
      return hydratedPokemon;
    } catch {
      return { ...pokemon, pokedexUrl: `https://pokemondb.net/pokedex/${slugify(pokemon.name)}` };
    }
  }));
  return hydrated;
}
