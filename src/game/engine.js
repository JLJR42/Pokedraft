export const DUPLICATE_MODES = Object.freeze({
  league: 'league',
  players: 'players',
  unlimited: 'unlimited'
});

const clone = (value) => structuredClone(value);

export class LeagueEngine {
  constructor({ pokemonPool, random = Math.random } = {}) {
    this.pokemonPool = pokemonPool ?? [];
    this.random = random;
  }

  createLeague({ playerNames, duplicateMode = DUPLICATE_MODES.players }) {
    if (!Array.isArray(playerNames) || playerNames.length !== 2 || playerNames.some((name) => !name.trim())) {
      throw new Error('A league needs two named players.');
    }
    return {
      format: '6v6 National Dex Ubers Doubles',
      duplicateMode,
      phase: 'draft',
      players: playerNames.map((name, index) => ({ id: `player-${index + 1}`, name: name.trim(), roster: [], wins: 0, losses: 0, lossStreak: 0, rerollAvailable: false })),
      draft: { pool: [], picks: [], currentPick: 0 },
      matches: [],
      rerolls: []
    };
  }

  generateDraftPool(league, count = 12) {
    const available = this.getAvailable(league);
    if (available.length < count) throw new Error('There are not enough eligible Pokémon for this pool.');
    league.draft.pool = this.sample(available, count);
    league.draft.picks = [];
    league.draft.currentPick = 0;
    league.phase = 'draft';
    return league.draft.pool;
  }

  getAvailable(league, { exclude = [] } = {}) {
    const excluded = new Set(exclude.map((pokemon) => pokemon.name));
    return this.pokemonPool.filter((pokemon) => {
      if (excluded.has(pokemon.name)) return false;
      if (league.duplicateMode === DUPLICATE_MODES.league) return !league.players.some((player) => player.roster.some((pick) => pick.name === pokemon.name));
      return true;
    });
  }

  pick(league, pokemonName) {
    if (league.phase !== 'draft') throw new Error('The draft is complete.');
    if (league.draft.picks.some((pick) => pick.pokemon.name === pokemonName)) throw new Error('That Pokémon has already been drafted.');
    const pokemon = league.draft.pool.find((candidate) => candidate.name === pokemonName);
    if (!pokemon) throw new Error('Choose a Pokémon from the current pool.');
    const playerIndex = league.draft.currentPick % 2 === 0 ? 0 : 1;
    const player = league.players[playerIndex];
    if (player.roster.length >= 6) throw new Error(`${player.name} already has six Pokémon.`);
    player.roster.push(clone(pokemon));
    league.draft.picks.push({ playerId: player.id, pokemon: clone(pokemon) });
    league.draft.currentPick += 1;
    if (league.draft.currentPick >= 12) league.phase = 'league';
    return league;
  }

  recordMatch(league, winnerId) {
    if (league.phase !== 'league') throw new Error('Finish the draft before recording matches.');
    if (league.rerolls.some((reroll) => !reroll.resolved)) throw new Error('Resolve the current reroll before recording another battle.');
    const winner = league.players.find((player) => player.id === winnerId);
    const loser = league.players.find((player) => player.id !== winnerId);
    if (!winner || !loser) throw new Error('Choose a valid winner.');
    winner.wins += 1;
    winner.lossStreak = 0;
    winner.rerollAvailable = false;
    loser.losses += 1;
    loser.lossStreak += 1;
    loser.rerollAvailable = true;
    league.matches.push({ id: `match-${league.matches.length + 1}`, winnerId: winner.id, loserId: loser.id, playedAt: new Date().toISOString() });
    return league;
  }

  createRerollCandidates(league, playerId) {
    const player = league.players.find((entry) => entry.id === playerId);
    if (!player || !player.rerollAvailable) throw new Error('A reroll is available only once after each loss.');
    if (league.rerolls.some((reroll) => reroll.playerId === playerId && !reroll.resolved)) throw new Error('Resolve the current reroll before creating another one.');
    const available = this.getAvailable(league).filter((pokemon) => league.duplicateMode === DUPLICATE_MODES.unlimited || !player.roster.some((pick) => pick.name === pokemon.name));
    if (available.length < 1) throw new Error('There are no eligible reroll candidates for this roster.');
    const candidates = this.sample(available, Math.min(player.lossStreak, available.length));
    while (candidates.length < player.lossStreak) candidates.push(available[Math.floor(this.random() * available.length)]);
    const reroll = { id: `reroll-${league.rerolls.length + 1}`, playerId, candidates: clone(candidates), accepted: [], resolved: false, createdAt: new Date().toISOString() };
    player.rerollAvailable = false;
    league.rerolls.push(reroll);
    return reroll;
  }

  resolveReroll(league, rerollId, replacements) {
    const reroll = league.rerolls.find((entry) => entry.id === rerollId);
    const player = reroll && league.players.find((entry) => entry.id === reroll.playerId);
    if (!reroll || !player || reroll.resolved) throw new Error('That reroll has already been resolved or does not exist.');
    const candidateNames = new Set(reroll.candidates.map((candidate) => candidate.name));
    const usedSlots = new Set();
    for (const replacement of replacements) {
      if (!candidateNames.has(replacement.candidateName) || usedSlots.has(replacement.rosterName)) throw new Error('Each candidate and roster slot can be used once.');
      const rosterIndex = player.roster.findIndex((pokemon) => pokemon.name === replacement.rosterName);
      if (rosterIndex < 0) throw new Error('A reroll replacement must target the player roster.');
      player.roster[rosterIndex] = clone(reroll.candidates.find((candidate) => candidate.name === replacement.candidateName));
      usedSlots.add(replacement.rosterName);
    }
    reroll.accepted = clone(replacements);
    reroll.resolved = true;
    return league;
  }

  sample(items, count) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(this.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy.slice(0, count);
  }
}
