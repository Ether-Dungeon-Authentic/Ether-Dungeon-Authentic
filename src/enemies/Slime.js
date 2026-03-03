import { Enemy } from './BaseEnemy.js';

export class Slime extends Enemy {
    constructor(game, x, y) {
        super(game, x, y, 32, 32, '#ff4444', 37.5, 45, 'slime', 50);
        this.damage = 5; // Re-enable contact damage
        this.displayName = 'スライム';
    }
}
