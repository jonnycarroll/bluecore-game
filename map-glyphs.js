class MapGlyphRenderer {
    constructor(tokens) {
        this.tokens = tokens;
        this.iconCache = new Map();
    }

    setTokens(tokens) {
        this.tokens = tokens;
        this.iconCache.clear();
    }

    drawResourceMarker(ctx, resource, x, y, claimed) {
        const alpha = claimed ? 1 : 0.68;
        const lift = 13 + resource.tier * 3;
        const icon = this.getResourceIcon(resource, claimed);

        ctx.save();
        ctx.globalAlpha = alpha;
        this.drawResourceShadow(ctx, x, y - 2, claimed);
        ctx.drawImage(icon, x - icon.width / 2, y - lift - icon.height / 2);
        ctx.restore();
    }

    getResourceIcon(resource, claimed) {
        const key = `${resource.type}:${resource.tier}:${claimed ? 'claimed' : 'open'}`;
        const cachedIcon = this.iconCache.get(key);
        if (cachedIcon) {
            return cachedIcon;
        }

        const icon = document.createElement('canvas');
        icon.width = 56;
        icon.height = 56;
        const ctx = icon.getContext('2d');
        const centerX = icon.width / 2;
        const centerY = icon.height / 2 - 3;

        if (resource.type === 'energy') {
            this.drawSparkIcon(ctx, centerX, centerY, resource.tier, claimed);
        } else {
            this.drawAtomIcon(ctx, centerX, centerY, resource.tier, claimed);
        }

        this.drawTierPips(ctx, centerX, centerY + 13 + resource.tier, resource.tier, resource.type, claimed);
        this.iconCache.set(key, icon);

        return icon;
    }

    drawResourceShadow(ctx, x, y, claimed) {
        ctx.beginPath();
        ctx.ellipse(x, y, claimed ? 9 : 7, claimed ? 4 : 3, 0, 0, Math.PI * 2);
        ctx.fillStyle = claimed ? this.tokens.shadowClaimed : this.tokens.shadowOpen;
        ctx.fill();
    }

    drawSparkIcon(ctx, x, y, tier, claimed) {
        const size = 8 + tier * 1.8;

        ctx.beginPath();
        ctx.moveTo(x + size * 0.18, y - size);
        ctx.lineTo(x - size * 0.58, y + size * 0.08);
        ctx.lineTo(x - size * 0.08, y + size * 0.08);
        ctx.lineTo(x - size * 0.32, y + size);
        ctx.lineTo(x + size * 0.64, y - size * 0.22);
        ctx.lineTo(x + size * 0.1, y - size * 0.22);
        ctx.closePath();
        ctx.fillStyle = claimed ? this.tokens.energyClaimed : this.tokens.energyOpen;
        ctx.fill();
        ctx.strokeStyle = this.tokens.energyStroke;
        ctx.lineJoin = 'round';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + size * 0.08, y - size * 0.68);
        ctx.lineTo(x - size * 0.24, y - size * 0.08);
        ctx.lineTo(x + size * 0.08, y - size * 0.08);
        ctx.strokeStyle = this.tokens.energyHighlight;
        ctx.lineWidth = 1.8;
        ctx.stroke();
    }

    drawAtomIcon(ctx, x, y, tier, claimed) {
        const radius = 5 + tier * 1.6;

        ctx.strokeStyle = claimed ? this.tokens.researchClaimed : this.tokens.researchOpen;
        ctx.lineWidth = 1.4 + tier * 0.18;
        this.drawAtomOrbit(ctx, x, y, radius, 0);
        this.drawAtomOrbit(ctx, x, y, radius, Math.PI / 3);
        this.drawAtomOrbit(ctx, x, y, radius, -Math.PI / 3);

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = claimed ? this.tokens.researchCoreClaimed : this.tokens.researchCoreOpen;
        ctx.fill();
        ctx.strokeStyle = this.tokens.researchStroke;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    drawTierPips(ctx, x, y, tier, resourceType, claimed) {
        const pipRadius = claimed ? 2 : 1.7;
        const gap = 5;
        const startX = x - ((tier - 1) * gap) / 2;

        ctx.save();
        for (let index = 0; index < tier; index++) {
            ctx.beginPath();
            ctx.arc(startX + index * gap, y, pipRadius, 0, Math.PI * 2);
            ctx.fillStyle = resourceType === 'energy'
                ? (claimed ? this.tokens.energyPipClaimed : this.tokens.energyPipOpen)
                : (claimed ? this.tokens.researchPipClaimed : this.tokens.researchPipOpen);
            ctx.fill();
            ctx.strokeStyle = this.tokens.pipStroke;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        ctx.restore();
    }

    drawAtomOrbit(ctx, x, y, radius, rotation) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 1.35, radius * 0.48, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

if (typeof module !== 'undefined') {
    module.exports = {
        MapGlyphRenderer
    };
}
