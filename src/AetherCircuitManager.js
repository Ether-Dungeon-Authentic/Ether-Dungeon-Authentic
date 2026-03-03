import { chipsDB } from '../data/chips_db.js';

/**
 * Manages the Aether Circuit (mod system).
 * Handles equipped chips, capacity, and stat calculations.
 */
export class AetherCircuitManager {
    constructor(player) {
        this.player = player;
        this.slots = new Array(6).fill(null); // 6 slots for chips
        this.ownedChips = []; // All chips in collection
        this.maxCapacity = 20; // Initial capacity
    }

    /**
     * Calculates current capacity based on level (example).
     */
    updateCapacity() {
        // Implementation could depend on player level or specific upgrades
        this.maxCapacity = 20 + (this.player.currentFloor * 2);
    }

    get usedCapacity() {
        return this.slots.reduce((total, chip) => {
            return total + (chip ? chip.getCurrentCost() : 0);
        }, 0);
    }

    /**
     * Equips a chip to a specific slot.
     */
    equipChip(chipInstance, slotIndex) {
        if (slotIndex < 0 || slotIndex >= 6) return false;

        // Remove from existing slot if already equipped
        const existingSlot = this.slots.indexOf(chipInstance);
        if (existingSlot !== -1) {
            this.slots[existingSlot] = null;
        }

        // Check capacity
        const newTotal = this.usedCapacity + chipInstance.getCurrentCost();
        if (newTotal > this.maxCapacity) {
            console.warn("Aether Circuit: Over capacity!");
            return false;
        }

        this.slots[slotIndex] = chipInstance;
        return true;
    }

    unequipChip(slotIndex) {
        if (slotIndex >= 0 && slotIndex < 6) {
            this.slots[slotIndex] = null;
        }
    }

    /**
     * Recalculates all bonuses from equipped chips.
     */
    getBonuses() {
        const bonuses = {
            damageMult: 0,
            maxHp: 0,
            speedMult: 0,
            aetherChargeMult: 0,
            fireDamageMult: 0,
            critRateAdd: 0,
            onHitDamageBuff: 0
        };

        this.slots.forEach(chip => {
            if (chip) {
                const effect = chip.getCurrentEffect();
                if (chip.data.effectType === 'damage_mult') bonuses.damageMult += effect;
                if (chip.data.effectType === 'max_hp') bonuses.maxHp += effect;
                if (chip.data.effectType === 'speed_mult') bonuses.speedMult += effect;
                if (chip.data.effectType === 'aether_charge_mult') bonuses.aetherChargeMult += effect;
                if (chip.data.effectType === 'fire_damage_mult') bonuses.fireDamageMult += effect;
                if (chip.data.effectType === 'crit_rate_add') bonuses.critRateAdd += effect;
                if (chip.data.effectType === 'on_hit_damage_buff') bonuses.onHitDamageBuff += effect;
            }
        });

        return bonuses;
    }

    /**
     * Load data for Aether Circuit.
     */
    deserialize(data) {
        if (!data) return;

        // Load owned chips
        this.ownedChips = (data.ownedChips || []).map(chipData => {
            return new ChipInstance(chipData.id, chipData.level);
        });

        // Load equipment
        if (data.equippedChipIds) {
            data.equippedChipIds.forEach((instanceId, idx) => {
                if (instanceId && idx < 6) {
                    const chip = this.ownedChips.find(c => c.instanceId === instanceId);
                    if (chip) this.slots[idx] = chip;
                }
            });
        }
    }

    serialize() {
        return {
            ownedChips: this.ownedChips.map(c => c.serialize()),
            equippedChipIds: this.slots.map(c => c ? c.instanceId : null)
        };
    }
}

/**
 * Instance of a chip in the inventory.
 */
export class ChipInstance {
    constructor(id, level = 1) {
        this.data = chipsDB.find(c => c.id === id);
        this.instanceId = Math.random().toString(36).substr(2, 9);
        this.level = level;
    }

    getCurrentCost() {
        const rank = this.data.ranks.find(r => r.level === this.level);
        return rank ? rank.cost : this.data.baseCost;
    }

    getCurrentEffect() {
        const rank = this.data.ranks.find(r => r.level === this.level);
        return rank ? rank.value : 0;
    }

    serialize() {
        return {
            id: this.data.id,
            level: this.level,
            instanceId: this.instanceId
        };
    }
}
