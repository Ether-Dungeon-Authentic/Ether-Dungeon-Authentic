import { Enemy } from './BaseEnemy.js';

export class Slime extends Enemy {
    constructor(game, x, y, level = 1) {
        super(game, x, y, 32, 32, '#ff4444', 20, 45, 'slime', 50, level);
        this.damage = 5; // Fixed contact damage
        this.displayName = `Lv.${level} スライム`;
    }
}
