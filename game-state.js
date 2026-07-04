const GameStateConstants = {
    startingEnergy: 40,
    startingResearch: 0,
    techBonus: 0.25,
    techBaseCost: 5,
    levelResearchAward: 5
};

class IdleGameState {
    constructor() {
        this.energy = GameStateConstants.startingEnergy;
        this.research = GameStateConstants.startingResearch;
        this.baseXp = 0;
        this.baseLevel = 1;
        this.selectedTile = { x: 0, y: 0 };
        this.claimedTiles = new Set([IdleGameState.tileKey(0, 0)]);
        this.claimedTileList = [{ x: 0, y: 0 }];
        this.techs = {
            energy: 0,
            research: 0
        };
        this.lastLevelResearchAward = 0;
        this.lastTick = 0;
        this.productionRates = null;
        this.productionRatesDirty = true;
    }

    static tileKey(x, y) {
        return `${x},${y}`;
    }

    static manhattanDistance(x, y) {
        return Math.abs(x) + Math.abs(y);
    }

    static hashCoordinate(x, y) {
        let hash = Math.imul(x + 0x9e3779b9, 0x85ebca6b);
        hash ^= Math.imul(y + 0xc2b2ae35, 0x27d4eb2f);
        hash ^= hash >>> 16;
        hash = Math.imul(hash, 0x7feb352d);
        hash ^= hash >>> 15;
        hash = Math.imul(hash, 0x846ca68b);
        hash ^= hash >>> 16;

        return hash >>> 0;
    }

    static rollCoordinate(x, y) {
        return IdleGameState.hashCoordinate(x, y) / 0xffffffff;
    }

    static getResourceAt(x, y) {
        const key = IdleGameState.tileKey(x, y);
        if (IdleGameState.resourceCache.has(key)) {
            return IdleGameState.resourceCache.get(key);
        }

        const distance = IdleGameState.manhattanDistance(x, y);
        let resource = null;

        if (distance >= 4 && (x !== 0 || y !== 0)) {
            const roll = IdleGameState.rollCoordinate(x, y);

            if (distance <= 7) {
                resource = roll < 0.1 ? { type: 'energy', tier: 1, rate: 1.2 } : null;
            } else if (distance <= 13) {
                if (roll < 0.05) {
                    resource = { type: 'research', tier: 1, rate: 0.25 };
                } else if (roll < 0.2) {
                    resource = { type: 'energy', tier: 2, rate: 2.6 };
                }
            } else if (distance <= 21) {
                if (roll < 0.08) {
                    resource = { type: 'research', tier: 2, rate: 0.5 };
                } else if (roll < 0.25) {
                    resource = { type: 'energy', tier: 3, rate: 4.4 };
                }
            } else if (roll < 0.06) {
                resource = { type: 'research', tier: 3, rate: 1 };
            } else if (roll < 0.22) {
                resource = { type: 'energy', tier: 4, rate: 7 };
            }
        }

        IdleGameState.resourceCache.set(key, resource);
        return resource;
    }

    getGlobalRevealRadius() {
        return 5 + this.baseLevel * 4;
    }

    getMaxTechLevel() {
        return Math.max(0, this.baseLevel - 1);
    }

    getHomeEnergyRate() {
        return 0.4 + this.baseLevel * 0.2;
    }

    getBaseXpRequired() {
        return Math.round(90 + Math.pow(this.baseLevel, 1.65) * 70);
    }

    isClaimed(x, y) {
        return this.claimedTiles.has(IdleGameState.tileKey(x, y));
    }

    isHomeCore(x, y) {
        return x === 0 && y === 0;
    }

    isAdjacentToClaimed(x, y) {
        return this.isClaimed(x + 1, y) ||
            this.isClaimed(x - 1, y) ||
            this.isClaimed(x, y + 1) ||
            this.isClaimed(x, y - 1);
    }

    isRevealed(x, y) {
        if (IdleGameState.manhattanDistance(x, y) <= this.getGlobalRevealRadius()) {
            return true;
        }

        return false;
    }

    getClaimCost(x, y) {
        if (this.isHomeCore(x, y)) {
            return 0;
        }

        return 12 + IdleGameState.manhattanDistance(x, y) * 4;
    }

    canClaim(x, y) {
        return !this.isClaimed(x, y) &&
            this.isRevealed(x, y) &&
            this.isAdjacentToClaimed(x, y) &&
            this.energy >= this.getClaimCost(x, y);
    }

    markProductionDirty() {
        this.productionRatesDirty = true;
    }

    addClaimedTile(x, y) {
        const key = IdleGameState.tileKey(x, y);
        if (this.claimedTiles.has(key)) {
            return false;
        }

        this.claimedTiles.add(key);
        this.claimedTileList.push({ x, y });
        this.markProductionDirty();

        return true;
    }

    claimTile(x, y) {
        if (!this.canClaim(x, y)) {
            return false;
        }

        this.energy -= this.getClaimCost(x, y);
        this.addClaimedTile(x, y);
        this.selectedTile = { x, y };

        return true;
    }

    selectTile(x, y) {
        this.selectedTile = { x, y };
    }

    getProductionRates() {
        if (!this.productionRatesDirty && this.productionRates) {
            return this.productionRates;
        }

        const rates = {
            energy: this.getHomeEnergyRate(),
            research: 0,
            baseXp: 0,
            homeEnergy: this.getHomeEnergyRate(),
            resourceEnergy: 0,
            resourceResearch: 0
        };
        const energyMultiplier = this.getTechMultiplier('energy');
        const researchMultiplier = this.getTechMultiplier('research');

        for (const tile of this.claimedTileList) {
            const resource = IdleGameState.getResourceAt(tile.x, tile.y);
            if (!resource) {
                continue;
            }

            if (resource.type === 'energy') {
                const rate = resource.rate * energyMultiplier;
                rates.energy += rate;
                rates.resourceEnergy += rate;
            } else if (resource.type === 'research') {
                const rate = resource.rate * researchMultiplier;
                rates.research += rate;
                rates.resourceResearch += rate;
            }
        }

        rates.homeEnergy *= energyMultiplier;
        rates.energy = rates.homeEnergy + rates.resourceEnergy;
        rates.baseXp = rates.homeEnergy * 0.2 + rates.resourceEnergy * 0.6 + rates.resourceResearch * 4;
        this.productionRates = rates;
        this.productionRatesDirty = false;

        return rates;
    }

    tick(deltaSeconds) {
        const elapsed = Math.max(0, deltaSeconds);
        const rates = this.getProductionRates();

        this.energy += rates.energy * elapsed;
        this.research += rates.research * elapsed;
        this.baseXp += rates.baseXp * elapsed;

        return rates;
    }

    tickFromTimestamp(timestampMs) {
        if (this.lastTick === 0) {
            this.lastTick = timestampMs;
            return this.getProductionRates();
        }

        const deltaSeconds = Math.min((timestampMs - this.lastTick) / 1000, 2);
        this.lastTick = timestampMs;

        return this.tick(deltaSeconds);
    }

    canLevelUpBase() {
        return this.baseXp >= this.getBaseXpRequired();
    }

    levelUpBase() {
        if (!this.canLevelUpBase()) {
            return false;
        }

        this.baseLevel += 1;
        this.lastLevelResearchAward = this.getLevelResearchAward();
        this.research += this.lastLevelResearchAward;
        this.resetRunResources();

        return true;
    }

    resetRunResources() {
        this.energy = GameStateConstants.startingEnergy;
        this.baseXp = 0;
        this.selectedTile = { x: 0, y: 0 };
        this.claimedTiles = new Set([IdleGameState.tileKey(0, 0)]);
        this.claimedTileList = [{ x: 0, y: 0 }];
        this.lastTick = 0;
        this.markProductionDirty();
    }

    getLevelResearchAward() {
        return this.baseLevel * GameStateConstants.levelResearchAward;
    }

    getTechMultiplier(techName) {
        return 1 + (this.techs[techName] || 0) * GameStateConstants.techBonus;
    }

    canUpgradeTech(techName) {
        return Object.prototype.hasOwnProperty.call(this.techs, techName) &&
            this.techs[techName] < this.getMaxTechLevel() &&
            this.research >= this.getTechCost(techName);
    }

    getTechCost(techName) {
        if (!Object.prototype.hasOwnProperty.call(this.techs, techName)) {
            return Infinity;
        }

        return GameStateConstants.techBaseCost * (this.techs[techName] + 1);
    }

    upgradeTech(techName) {
        if (!this.canUpgradeTech(techName)) {
            return false;
        }

        this.research -= this.getTechCost(techName);
        this.techs[techName] += 1;
        this.markProductionDirty();

        return true;
    }

    getSelectedTileDetails() {
        const { x, y } = this.selectedTile;

        return this.getTileDetails(x, y);
    }

    getTileDetails(x, y) {
        const resource = IdleGameState.getResourceAt(x, y);

        return {
            x,
            y,
            distance: IdleGameState.manhattanDistance(x, y),
            isHomeCore: this.isHomeCore(x, y),
            isClaimed: this.isClaimed(x, y),
            isRevealed: this.isRevealed(x, y),
            isAdjacent: this.isAdjacentToClaimed(x, y),
            claimCost: this.getClaimCost(x, y),
            canClaim: this.canClaim(x, y),
            resource
        };
    }
}

IdleGameState.resourceCache = new Map();

if (typeof module !== 'undefined') {
    module.exports = {
        IdleGameState,
        GameStateConstants
    };
}
