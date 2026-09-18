import test from 'node:test';
import assert from 'node:assert/strict';
import { DUPLICATE_MODES, LeagueEngine } from '../src/game/engine.js';
import { POKEMON_POOL } from '../src/game/pokemon.js';
import { isDraftEligiblePokemon } from '../src/game/pokemon.js';

const setup = (duplicateMode = DUPLICATE_MODES.players) => {
  const engine = new LeagueEngine({ pokemonPool: POKEMON_POOL, random: () => 0 });
  const league = engine.createLeague({ playerNames: ['Ash', 'Misty'], duplicateMode });
  engine.generateDraftPool(league);
  return { engine, league };
};

test('generates a twelve-Pokemon pool and snake draft fills both rosters', () => {
  const { engine, league } = setup();
  assert.equal(league.draft.pool.length, 12);
  for (const pokemon of league.draft.pool) engine.pick(league, pokemon.name);
  assert.equal(league.phase, 'league');
  assert.deepEqual(league.players.map((player) => player.roster.length), [6, 6]);
  assert.equal(league.draft.picks[0].playerId, 'player-1');
  assert.equal(league.draft.picks[1].playerId, 'player-2');
});

test('excludes transformation-only forms but keeps the base species', () => {
  assert.equal(isDraftEligiblePokemon('garchomp'), true);
  assert.equal(isDraftEligiblePokemon('garchomp-mega'), false);
  assert.equal(isDraftEligiblePokemon('charizard-gmax'), false);
  assert.equal(isDraftEligiblePokemon('pikachu-gigantamax'), false);
  assert.equal(isDraftEligiblePokemon('eternatus-eternamax'), false);
});

test('the engine excludes transformation forms from an injected pool', () => {
  const engine = new LeagueEngine({ pokemonPool: [{ name: 'garchomp' }, { name: 'garchomp-mega' }, { name: 'charizard-gmax' }] });
  const league = engine.createLeague({ playerNames: ['Ash', 'Misty'] });
  assert.deepEqual(engine.getAvailable(league).map((pokemon) => pokemon.name), ['garchomp']);
});

test('a loss increments streak and creates that many independent candidates', () => {
  const { engine, league } = setup();
  for (const pokemon of league.draft.pool) engine.pick(league, pokemon.name);
  engine.recordMatch(league, 'player-1');
  engine.recordMatch(league, 'player-1');
  const reroll = engine.createRerollCandidates(league, 'player-2');
  assert.equal(league.players[1].lossStreak, 2);
  assert.equal(reroll.candidates.length, 2);
});

test('a win resets the winner loss streak', () => {
  const { engine, league } = setup();
  for (const pokemon of league.draft.pool) engine.pick(league, pokemon.name);
  engine.recordMatch(league, 'player-1');
  engine.recordMatch(league, 'player-2');
  assert.equal(league.players[0].lossStreak, 1);
  assert.equal(league.players[1].lossStreak, 0);
});

test('a resolved reroll cannot be created again, even when every candidate is discarded', () => {
  const { engine, league } = setup();
  for (const pokemon of league.draft.pool) engine.pick(league, pokemon.name);
  engine.recordMatch(league, 'player-1');
  const reroll = engine.createRerollCandidates(league, 'player-2');
  engine.resolveReroll(league, reroll.id, []);
  assert.equal(reroll.resolved, true);
  assert.throws(() => engine.createRerollCandidates(league, 'player-2'), /only once after each loss/);
  assert.throws(() => engine.resolveReroll(league, reroll.id, []), /already been resolved/);
});

test('a new battle cannot be recorded until the previous loss reroll is resolved', () => {
  const { engine, league } = setup();
  for (const pokemon of league.draft.pool) engine.pick(league, pokemon.name);
  engine.recordMatch(league, 'player-1');
  const reroll = engine.createRerollCandidates(league, 'player-2');
  assert.throws(() => engine.recordMatch(league, 'player-1'), /Resolve the current reroll/);
  engine.resolveReroll(league, reroll.id, []);
  engine.recordMatch(league, 'player-1');
  assert.equal(league.matches.length, 2);
  assert.equal(league.players[1].rerollAvailable, true);
});
