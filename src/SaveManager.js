import { skillsDB } from '../data/skills_db.js';

/**
 * Manages persistent game data using localStorage.
 */
export class SaveManager {
    static STORAGE_KEY = 'aether_dungeon_save_data';

    /**
     * Retrieves the current save data from localStorage.
     * @returns {Object} The save data object.
     */
    static getSaveData() {
        const isDebug = new URLSearchParams(window.location.search).get('debug') === 'true';

        let data = localStorage.getItem(this.STORAGE_KEY);
        let parsedData;

        if (data) {
            try {
                parsedData = JSON.parse(data);
            } catch (e) {
                console.error('Failed to parse save data:', e);
                parsedData = this.createInitialData();
            }
        } else {
            parsedData = this.createInitialData();
        }

        // Debug Mode: Force all skills unlocked
        if (isDebug) {
            const allSkillIds = skillsDB.map(s => s.id);
            parsedData.unlockedSkills = [...new Set([...(parsedData.unlockedSkills || []), ...allSkillIds])];
            parsedData.unlockedStartingSkills = [...new Set([...(parsedData.unlockedStartingSkills || []), ...allSkillIds])];
            console.log('[SaveManager] Debug Mode: All skills unlocked temporarily.');
        }

        return parsedData;
    }

    /**
     * Saves the data object to localStorage.
     * @param {Object} data The data to save.
     */
    static saveData(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }

    /**
     * Creates the initial structure for save data.
     * @returns {Object}
     */
    static createInitialData() {
        return {
            playerLevel: 1,
            playerExp: 0,
            unlockedSkills: [
                'flame_fan', 'slash', // Normal
                'fireball', 'thunder_burst', 'ice_spike', // Primary
                'ember_strike', 'thunder_god_wrath', 'ice_garden' // Ultimate
            ],
            unlockedStartingSkills: [
                'flame_fan', 'slash', // Normal
                'fireball', 'thunder_burst', 'ice_spike', // Primary
                'ember_strike', 'thunder_god_wrath', 'ice_garden' // Ultimate
            ],
            stats: {
                totalKills: 0,
                totalRuns: 0,
                deepestFloor: 0,
                highScore: 0
            },
            aetherShards: 0,
            aetherFragments: 0,
            aetherCircuit: {
                ownedChips: [
                    { id: 'power_strike', level: 1, isIdentified: true },
                    { id: 'life_spark', level: 1, isIdentified: true },
                    { id: 'swift_step', level: 1, isIdentified: true }
                ],
                equippedChipIds: [null, null, null, null, null, null]
            }
        };
    }

    /**
     * Records a newly unlocked skill for the collection.
     * @param {string} skillId 
     */
    static unlockSkill(skillId) {
        const data = this.getSaveData();
        if (!data.unlockedSkills.includes(skillId)) {
            data.unlockedSkills.push(skillId);
            this.saveData(data);
            console.log(`[SaveManager] Skill unlocked (Collection): ${skillId}`);
        }
    }

    /**
     * Records a skill as permanently available for starting equipment.
     * @param {string} skillId 
     */
    static unlockStartingSkill(skillId) {
        const data = this.getSaveData();
        if (!data.unlockedStartingSkills) data.unlockedStartingSkills = [];
        if (!data.unlockedStartingSkills.includes(skillId)) {
            data.unlockedStartingSkills.push(skillId);
            this.saveData(data);
            console.log(`[SaveManager] Starting Skill unlocked: ${skillId}`);
        }
    }

    /**
     * Checks if a skill is in the collection.
     * @param {string} skillId 
     * @returns {boolean}
     */
    static isSkillUnlocked(skillId) {
        const data = this.getSaveData();
        return data.unlockedSkills.includes(skillId);
    }

    /**
     * Checks if a skill is available as starting equipment.
     * @param {string} skillId 
     * @returns {boolean}
     */
    static isStartingSkillUnlocked(skillId) {
        const data = this.getSaveData();
        if (!data.unlockedStartingSkills) return this.isSkillUnlocked(skillId); // Fallback for old saves
        return data.unlockedStartingSkills.includes(skillId);
    }

    /**
     * Updates the high score if the new score is higher.
     * @param {number} newScore 
     * @returns {boolean} True if a new record was set.
     */
    static updateHighScore(newScore) {
        const data = this.getSaveData();
        if (!data.stats.highScore || newScore > data.stats.highScore) {
            data.stats.highScore = newScore;
            this.saveData(data);
            return true;
        }
        return false;
    }

    /**
     * 経験値を加算し、必要に応じてレベルアップ処理を行う
     * @param {number} amount 獲得EXP
     * @returns {Object} レベルアップ結果の情報
     */
    static addExp(amount) {
        const data = this.getSaveData();
        
        // データが存在しない場合のフォールバック
        if (data.playerLevel === undefined) data.playerLevel = 1;
        if (data.playerExp === undefined) data.playerExp = 0;

        const oldLevel = data.playerLevel;
        data.playerExp += amount;

        let isLevelUp = false;
        let requiredExp = data.playerLevel * 100;

        // 複数レベルアップに対応するループ
        while (data.playerExp >= requiredExp) {
            data.playerExp -= requiredExp;
            data.playerLevel += 1;
            isLevelUp = true;
            requiredExp = data.playerLevel * 100;
        }

        this.saveData(data);

        return {
            gainedExp: amount,
            isLevelUp: isLevelUp,
            oldLevel: oldLevel,
            newLevel: data.playerLevel,
            currentExp: data.playerExp,
            nextExp: requiredExp
        };
    }

    /**
     * Clears all save data from localStorage.
     */
    static clearData() {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('[SaveManager] Data cleared.');
    }
}
