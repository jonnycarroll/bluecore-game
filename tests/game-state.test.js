const assert = require('node:assert/strict');
const { IdleGameState } = require('../game-state');

const firstResource = IdleGameState.getResourceAt(3, 1);
const repeatedResource = IdleGameState.getResourceAt(3, 1);
assert.deepEqual(firstResource, repeatedResource);
assert.deepEqual(firstResource, { type: 'energy', tier: 1, rate: 1.2 });
assert.equal(IdleGameState.getResourceAt(2, 1), null);

let earlyResourceTiles = 0;
for (let x = -7; x <= 7; x++) {
    for (let y = -7; y <= 7; y++) {
        const distance = IdleGameState.manhattanDistance(x, y);
        if (distance >= 4 && distance <= 7 && IdleGameState.getResourceAt(x, y)) {
            earlyResourceTiles += 1;
        }
    }
}
assert.ok(earlyResourceTiles <= 10);

const game = new IdleGameState();
assert.equal(game.isClaimed(0, 0), true);
assert.equal(game.isRevealed(1, 0), true);
assert.equal(game.canClaim(1, 0), true);
assert.equal(game.getClaimCost(1, 0), 16);

const farClaimableCost = game.getClaimCost(4, 0);
assert.equal(farClaimableCost, 28);
assert.equal(game.claimTile(1, 0), true);
assert.equal(game.isClaimed(1, 0), true);
assert.equal(Math.round(game.energy), 24);
assert.equal(game.canClaim(3, 0), false);

const productionGame = new IdleGameState();
productionGame.addClaimedTile(3, 1);
const resource = IdleGameState.getResourceAt(3, 1);
const rates = productionGame.getProductionRates();
assert.ok(Math.abs(rates.homeEnergy - 0.6) < 0.000001);
assert.ok(rates.energy >= rates.homeEnergy);
assert.equal(productionGame.getProductionRates(), rates);

productionGame.baseLevel = 2;
productionGame.research = 5;
assert.equal(productionGame.upgradeTech(resource.type), true);
productionGame.markProductionDirty();
const boostedRates = productionGame.getProductionRates();
if (resource.type === 'energy') {
    assert.equal(boostedRates.resourceEnergy, rates.resourceEnergy * 1.25);
} else {
    assert.equal(boostedRates.resourceResearch, rates.resourceResearch * 1.25);
}

const idleGame = new IdleGameState();
idleGame.tick(10);
assert.equal(idleGame.energy, 46);
assert.ok(Math.abs(idleGame.baseXp - 1.2) < 0.000001);

idleGame.baseXp = idleGame.getBaseXpRequired();
assert.equal(idleGame.canLevelUpBase(), true);
assert.equal(idleGame.levelUpBase(), true);
assert.equal(idleGame.baseLevel, 2);
assert.equal(idleGame.getGlobalRevealRadius(), 13);
assert.equal(idleGame.energy, 40);
assert.equal(idleGame.baseXp, 0);
assert.equal(idleGame.research, 10);
assert.equal(idleGame.claimedTileList.length, 1);

const techGame = new IdleGameState();
techGame.baseLevel = 2;
techGame.research = 5;
assert.equal(techGame.upgradeTech('energy'), true);
assert.equal(techGame.techs.energy, 1);
assert.equal(techGame.research, 0);
assert.equal(techGame.upgradeTech('energy'), false);
