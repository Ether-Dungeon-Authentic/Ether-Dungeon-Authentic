export const CONFIG = {
    GAME: {
        BASE_ZOOM: 1.2,
        TICK_RATE: 1 / 60,
        TRANSITION_DURATION: 0.5,
        FLOOR_SCORE_REWARD: 500,
        BASE_ENEMY_LEVEL: 5,
        DIFFICULTY_FACTORS: {
            easy: { level: 1, score: 0.2, shardMult: 0.5 },
            normal: { level: 5, score: 1.0, shardMult: 1.0 },
            hard: { level: 15, score: 2.0, shardMult: 1.0 }
        }
    },
    PLAYER: {
        BASE_MAX_HP: 300,
        BASE_SPEED: 260,
        DASH_SPEED: 900,
        DASH_DURATION: 0.1,
        DASH_COOLDOWN: 0.5,
        INVULNERABLE_DURATION: 0.5,
        AETHER_RUSH_DURATION: 15.0,
        ACCELERATION_MAX_TIME: 4.0,
        INTERACT_RANGE: 80
    },
    CIRCUIT: {
        GRID_SIZE: 5,
        CORE_X: 2,
        CORE_Y: 2,
        BASE_CAPACITY: 20
    },
    RESONANCE: {
        BASE_DROP: 5,         // Points from normal enemies
        BOSS_DROP_MULT: 10,   // Multiplier for bosses
        COST_PER_NODE: 10     // Cost per connected node to deploy a chip
    },
    MAP: {
        TILE_SIZE: 40,
        LOBBY_SIZE: 40,
        DUNGEON_SIZE: 110,
        COLLISION_MARGIN: 5
    },
    ENEMY: {
        SPAWN_DURATION: 0.67,
        TELEGRAPH_DURATION: 1.0,
        SEPARATION_FORCE: 150,
        CHIP_DROP_CHANCE: 0.2,
        SHARD_DROP_CHANCE: 0.5,
        FRAGMENT_DROP_CHANCE: 0.1,
        BOSS_CHIP_DROP_COUNT: 5,
        BOSS_CHEST_DROP_COUNT: 3
    }
};
