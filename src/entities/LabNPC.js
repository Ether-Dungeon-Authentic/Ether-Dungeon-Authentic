import { Entity, getCachedImage } from '../utils.js';
import { LabUI } from '../ui/LabUI.js';

export class LabNPC extends Entity {
    constructor(game, x, y) {
        super(game, x - 20, y - 30, 40, 60, '#00ffff', 1);
        this.image = getCachedImage('assets/entities/shop_npc.png'); // Placeholder image
        this.showPrompt = false;
    }

    update(dt) {
        // NPC is static
    }

    draw(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        if (this.image && this.image.complete && this.image.naturalWidth !== 0) {
            ctx.save();
            // Optional: Filter to distinguish from Shop NPC
            ctx.filter = 'hue-rotate(180deg)'; 
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            ctx.restore();
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

    }

    getInteractPrompt() {
        return "[F] アップグレード";
    }

    interact() {
        this.use();
    }

    use() {
        LabUI.open();
    }
}
