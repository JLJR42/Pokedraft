export const FORMAT = '6v6 National Dex Ubers Doubles';

const REGIONAL_FORM_SUFFIXES = ['-alola', '-galar', '-hisui', '-paldea'];
const CANONICAL_HYPHENATED_NAMES = new Set([
  'farfetchd', 'ho-oh', 'mr-mime', 'mime-jr', 'nidoran-f', 'nidoran-m', 'porygon-z', 'type-null',
  'jangmo-o', 'hakamo-o', 'kommo-o', 'tapu-koko', 'tapu-lele', 'tapu-bulu', 'tapu-fini',
  'wo-chien', 'chien-pao', 'ting-lu', 'chi-yu'
]);

export function isDraftEligiblePokemon(pokemon) {
  const name = typeof pokemon === 'string' ? pokemon : pokemon?.name;
  if (!name) return false;
  const normalizedName = name.toLowerCase();
  if (REGIONAL_FORM_SUFFIXES.some((suffix) => normalizedName.endsWith(suffix))) return true;
  if (!normalizedName.includes('-')) return true;
  return CANONICAL_HYPHENATED_NAMES.has(normalizedName);
}

export function getPokedexSlug(name) {
  const normalizedName = name.toLowerCase();
  const regionalSuffix = REGIONAL_FORM_SUFFIXES.find((suffix) => normalizedName.endsWith(suffix));
  return (regionalSuffix ? normalizedName.slice(0, -regionalSuffix.length) : normalizedName)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Compact local seed data keeps the first version fully usable on GitHub Pages.
export const POKEMON_POOL = [
  ['Miraidon','Electric / Dragon','Hadron Engine',[100,135,115,135,115,135]],
  ['Koraidon','Fighting / Dragon','Orichalcum Pulse',[100,135,115,135,115,135]],
  ['Calyrex-Shadow','Psychic / Ghost','As One (Spectrier)',[100,165,150,85,130,130]],
  ['Calyrex-Ice','Psychic / Ice','As One (Glastrier)',[100,165,150,85,130,50]],
  ['Zacian-Crowned','Fairy / Steel','Intrepid Sword',[92,170,115,80,115,148]],
  ['Zamazenta-Crowned','Fighting / Steel','Dauntless Shield',[92,130,145,80,145,128]],
  ['Kyogre','Water','Drizzle',[100,100,90,150,140,90]],
  ['Groudon','Ground','Drought',[100,150,140,100,90,90]],
  ['Rayquaza','Dragon / Flying','Air Lock',[105,150,90,150,90,95]],
  ['Yveltal','Dark / Flying','Dark Aura',[126,131,95,131,98,99]],
  ['Xerneas','Fairy','Fairy Aura',[126,131,95,131,98,99]],
  ['Lunala','Psychic / Ghost','Shadow Shield',[137,113,89,137,107,97]],
  ['Solgaleo','Psychic / Steel','Full Metal Body',[137,137,107,113,89,97]],
  ['Necrozma-Dusk-Mane','Psychic / Steel','Prism Armor',[97,157,127,113,109,77]],
  ['Necrozma-Dawn-Wings','Psychic / Ghost','Prism Armor',[97,113,109,157,127,77]],
  ['Eternatus','Poison / Dragon','Pressure',[140,85,95,145,95,130]],
  ['Dialga-Origin','Steel / Dragon','Pressure',[100,100,120,150,120,90]],
  ['Palkia-Origin','Water / Dragon','Pressure',[100,100,100,150,120,120]],
  ['Ho-Oh','Fire / Flying','Regenerator',[106,130,90,110,154,90]],
  ['Lugia','Psychic / Flying','Multiscale',[106,90,130,90,154,110]],
  ['Deoxys-Attack','Psychic','Pressure',[50,180,20,180,20,150]],
  ['Arceus','Normal','Multitype',[120,120,120,120,120,120]],
  ['Mewtwo','Psychic','Pressure',[106,150,70,194,120,140]],
  ['Giratina-Origin','Ghost / Dragon','Levitate',[150,120,100,120,100,90]]
].map(([name, types, ability, stats]) => ({ name, types: types.split(' / '), ability, stats }));
