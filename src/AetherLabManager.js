import { ChipInstance } from './AetherCircuitManager.js';
import { chipsDB } from '../data/chips_db.js';
/**
 * Handles the logic for the Aether Lab.
 */
export class AetherLabManager {
    static getUpgradeCost(chip) {
        // Initial upgrade (Lv 1->2) costs 10 shards. Scales thereafter.
        return {
            gold: 10 + (chip.level - 1) * chip.data.baseCost * 15,
            fragments: chip.level * 5
        };
    }


    static getDismantleYield(chip) {
        // Returns 50% of upgrade fragments spent + base yield
        return {
            fragments: Math.floor(chip.data.baseCost / 2) + (chip.level - 1) * 2
        };
    }

    static canUpgrade(player, chip) {
        if (chip.level >= 10) return false;
        const cost = this.getUpgradeCost(chip);
        return player.aetherShards >= cost.gold && player.aetherFragments >= cost.fragments;
    }

    static upgradeChip(player, chip) {
        if (!this.canUpgrade(player, chip)) return false;

        const cost = this.getUpgradeCost(chip);
        player.aetherShards -= cost.gold;
        player.aetherFragments -= cost.fragments;
        chip.level++;
        player.saveAetherData();
        return true;
    }


    static dismantleChip(player, chip) {
        const yieldData = this.getDismantleYield(chip);
        player.aetherFragments += yieldData.fragments;
        player.saveAetherData();

        // Remove from inventory
        const index = player.circuit.ownedChips.indexOf(chip);
        if (index !== -1) {
            player.circuit.ownedChips.splice(index, 1);
        }

        // Ensure it's unequipped
        const slotIdx = player.circuit.slots.indexOf(chip);
        if (slotIdx !== -1) {
            player.circuit.unequipChip(slotIdx);
        }

        return true;
    }

    static synthesisChip(player, category) {
        const cost = { gold: 200, fragments: 20 };
        if (player.aetherShards < cost.gold || player.aetherFragments < cost.fragments) return null;

        player.aetherShards -= cost.gold;
        player.aetherFragments -= cost.fragments;

        const available = chipsDB.filter(c => !category || c.category === category);
        if (available.length === 0) return null;

        const selected = available[Math.floor(Math.random() * available.length)];
        const newChip = new ChipInstance(selected.id, 1, true); // Create as identified
        player.circuit.ownedChips.push(newChip);
        player.saveAetherData();
        return newChip;
    }

    static getRandomChipByWeightedRarity() {
        const roll = Math.random() * 100;
        let selectedRarity = 'common';

        if (roll < 3) selectedRarity = 'legendary';
        else if (roll < 15) selectedRarity = 'epic';
        else if (roll < 40) selectedRarity = 'rare';
        else selectedRarity = 'common';

        // Filter chips by rarity
        let available = chipsDB.filter(c => c.rarity === selectedRarity);

        // Fallback sequence if no chips of that rarity exist
        if (available.length === 0) {
            const fallbackOrder = ['legendary', 'epic', 'rare', 'common'];
            const currentIndex = fallbackOrder.indexOf(selectedRarity);
            for (let i = currentIndex + 1; i < fallbackOrder.length; i++) {
                available = chipsDB.filter(c => fallbackOrder[i] && (c.rarity === fallbackOrder[i]));
                if (available && (available.length > 0)) break;
            }
        }

        if (!available || available.length === 0) return null;

        const selected = available[Math.floor(Math.random() * available.length)];
        return new ChipInstance(selected.id, 1, true);
    }
}
