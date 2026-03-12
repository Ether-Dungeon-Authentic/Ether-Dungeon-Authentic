import { Entity, getCachedImage } from '../utils.js';
import { showStageSettings } from '../ui.js';
import { skillsDB } from '../../data/skills_db.js';

export class SkillPedestal extends Entity {
    constructor(game, x, y) {
        super(game, x - 20, y - 20, 40, 40, '#adff2f', 1);
        this.showPrompt = false;
        // No specific asset yet, using a placeholder visual
    }

    update(dt) {
        // Static
    }

    draw(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        // Draw a technological pedestal
        ctx.save();
        
        // Base
        ctx.fillStyle = '#333';
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x + this.width - 5, this.y + 10);
        ctx.lineTo(this.x + 5, this.y + 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Glowing core
        const glow = 0.5 + Math.sin(Date.now() / 300) * 0.5;
        ctx.fillStyle = `rgba(0, 255, 255, ${0.3 + glow * 0.4})`;
        ctx.shadowBlur = 10 * glow;
        ctx.shadowColor = '#00ffff';
        ctx.beginPath();
        ctx.arc(cx, this.y + 15, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        if (this.showPrompt) {
            ctx.save();
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
            ctx.fillText('[SPACE] スキル選択', cx, this.y - 10);
            ctx.restore();
        }
    }

    use() {
        const allSkills = skillsDB; 
        showStageSettings(
            this.game,
            allSkills,
            (settings) => {
                // Determine if we are in the lobby (Floor 0) or starting from scratch
                if (this.game.floor === 0) {
                    // Just update skills without re-init (teleport)
                    this.game.updateStartingSkills(settings.skills);
                } else {
                    // Original behavior for non-lobby or explicit start
                    this.game.init(false, settings.difficulty, settings.skills, true);
                }
                
                // Hide title screen just in case (though it should be hidden)
                const titleScreen = document.getElementById('title-screen');
                if (titleScreen) titleScreen.style.display = 'none';
            },
            () => {
                // Return to lobby (do nothing)
            }
        );
    }
}
