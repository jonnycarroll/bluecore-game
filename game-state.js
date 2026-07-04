const GameStateConstants = {
    startingEnergy: 40,
    startingResearch: 0,
    expansionSkillDiscount: 0.08,
    productionSkillBonus: 0.25,
    surveyRadii: [0, 2, 3, 4],
    maxSkillLevel: 3,
    skillCosts: [20, 55, 120]
};

class IdleGameState {
    constructor() {
        this.energy = GameStateConstants.startingEnergy;
        this.research = GameStateConstants.startingResearch;
        this.baseXp = 0;
        this.baseLevel = 1;
        this.selectedTile = { x: 0, y: 0 };
        this.claimedTiles = new Set([IdleGameState.tileKey(0, 0)]);
        this.skills = {
            expansion: 0,
            production: 0,
            surveying: 0
        };
        this.lastTick = 0;
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
        const distance = IdleGameState.manhattanDistance(x, y);

        if (distance < 4 || (x === 0 && y === 0)) {
            return null;
        }

        const roll = IdleGameState.rollCoordinate(x, y);

        if (distance <= 7) {
            return roll < 0.1 ? { type: 'energy', tier: 1, rate: 1.2 } : null;
        }

        if (distance <= 13) {
            if (roll < 0.05) {
                return { type: 'research', tier: 1, rate: 0.25 };
            }

            return roll < 0.2 ? { type: 'energy', tier: 2, rate: 2.6 } : null;
        }

        if (distance <= 21) {
            if (roll < 0.08) {
                return { type: 'research', tier: 2, rate: 0.5 };
            }

            return roll < 0.25 ? { type: 'energy', tier: 3, rate: 4.4 } : null;
        }

        if (roll < 0.06) {
            return { type: 'research', tier: 3, rate: 1 };
        }

        return roll < 0.22 ? { type: 'energy', tier: 4, rate: 7 } : null;
    }

    getGlobalRevealRadius() {
        return 5 + this.baseLevel * 4;
    }

    getSurveyRadius() {
        return GameStateConstants.surveyRadii[this.skills.surveying];
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

        const surveyRadius = this.getSurveyRadius();
        if (surveyRadius <= 0) {
            return false;
        }

        for (const key of this.claimedTiles) {
            const [claimedX, claimedY] = key.split(',').map(Number);
            if (Math.abs(claimedX - x) + Math.abs(claimedY - y) <= surveyRadius) {
                return true;
            }
        }

        return false;
    }

    getClaimCost(x, y) {
        if (this.isHomeCore(x, y)) {
            return 0;
        }

        const baseCost = 12 + IdleGameState.manhattanDistance(x, y) * 4;
        const discount = 1 - this.skills.expansion * GameStateConstants.expansionSkillDiscount;

        return Math.max(1, Math.ceil(baseCost * discount));
    }

    canClaim(x, y) {
        return !this.isClaimed(x, y) &&
            this.isRevealed(x, y) &&
            this.isAdjacentToClaimed(x, y) &&
            this.energy >= this.getClaimCost(x, y);
    }

    claimTile(x, y) {
        if (!this.canClaim(x, y)) {
            return false;
        }

        this.energy -= this.getClaimCost(x, y);
        this.claimedTiles.add(IdleGameState.tileKey(x, y));
        this.selectedTile = { x, y };

        return true;
    }

    selectTile(x, y) {
        this.selectedTile = { x, y };
    }

    getProductionRates() {
        const rates = {
            energy: this.getHomeEnergyRate(),
            research: 0,
            baseXp: 0,
            homeEnergy: this.getHomeEnergyRate(),
            resourceEnergy: 0,
            resourceResearch: 0
        };
        const productionMultiplier = 1 + this.skills.production * GameStateConstants.productionSkillBonus;

        for (const key of this.claimedTiles) {
            const [x, y] = key.split(',').map(Number);
            const resource = IdleGameState.getResourceAt(x, y);
            if (!resource) {
                continue;
            }

            const rate = resource.rate * productionMultiplier;
            if (resource.type === 'energy') {
                rates.energy += rate;
                rates.resourceEnergy += rate;
            } else if (resource.type === 'research') {
                rates.research += rate;
                rates.resourceResearch += rate;
            }
        }

        rates.baseXp = rates.homeEnergy * 0.2 + rates.resourceEnergy * 0.6 + rates.resourceResearch * 4;

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

        this.baseXp -= this.getBaseXpRequired();
        this.baseLevel += 1;

        return true;
    }

    canPurchaseSkill(skillName) {
        return Object.prototype.hasOwnProperty.call(this.skills, skillName) &&
            this.skills[skillName] < GameStateConstants.maxSkillLevel &&
            this.research >= this.getSkillCost(skillName);
    }

    getSkillCost(skillName) {
        if (!Object.prototype.hasOwnProperty.call(this.skills, skillName)) {
            return Infinity;
        }

        return GameStateConstants.skillCosts[this.skills[skillName]] || Infinity;
    }

    purchaseSkill(skillName) {
        if (!this.canPurchaseSkill(skillName)) {
            return false;
        }

        this.research -= this.getSkillCost(skillName);
        this.skills[skillName] += 1;

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

if (typeof module !== 'undefined') {
    module.exports = {
        IdleGameState,
        GameStateConstants
    };
}
