import { LabUI } from './LabUI.js';

export class DungeonCircuitUI {
    static init(game) {
        this.game = game;
        
        const closeBtn = document.getElementById('btn-close-dungeon-circuit');
        if (closeBtn) {
            closeBtn.onclick = () => this.close();
        }
    }

    static open() {
        const modal = document.getElementById('dungeon-circuit-modal');
        if (modal) {
            modal.style.display = 'flex';
            if (this.game) {
                this.game.isHUDVisible = false; // hide gameplay HUD
            }
            this.render();
        }
    }

    static close() {
        const modal = document.getElementById('dungeon-circuit-modal');
        if (modal) {
            modal.style.display = 'none';
            if (this.game) {
                this.game.isHUDVisible = true;
            }
            // Hide tooltip if left open
            LabUI.hideTooltip();
        }
    }

    static render() {
        if (!this.game || !this.game.player) return;

        // Update Resonance Points
        const resElement = document.getElementById('dungeon-circuit-resonance');
        if (resElement) {
            resElement.textContent = this.game.player.aetherResonance;
        }

        const gridContainer = document.getElementById('dungeon-circuit-grid');
        if (!gridContainer) return;

        gridContainer.innerHTML = '';
        const circuit = this.game.player.circuit;

        for (let y = 0; y < 5; y++) {
            for (let x = 0; x < 5; x++) {
                const item = circuit.grid[y][x];
                
                if (item === 'core') {
                    const core = document.createElement('div');
                    core.className = 'grid-cell core-cell';
                    core.innerHTML = `<div>CORE</div>`;
                    gridContainer.appendChild(core);
                } else if (item) {
                    // Render Chip
                    const temp = document.createElement('div');
                    temp.innerHTML = LabUI.renderChip(item, true, false).trim();
                    const cell = temp.firstChild;
                    
                    // Add deployable visual indicator if applicable
                    const canDeploy = circuit.canDeployChip(x, y);
                    if (!item.isDeployed && canDeploy) {
                        cell.classList.add('deployable');
                    }

                    // Tooltip
                    cell.onmouseenter = (e) => {
                        const rect = cell.getBoundingClientRect();
                        let deployText = '';
                        if (!item.isDeployed) {
                            let trueCost = item.isSpecial ? 30 : item.getConnectedNodeCount() * 10;
                            if (canDeploy) {
                               deployText = `<br><span style="color:#00ffff; font-size:10px;">ダブルクリックで再構築 (コスト: ${trueCost}共鳴点)</span>`;
                            } else {
                               deployText = `<br><span style="color:#ff4444; font-size:10px;">※起動条件を満たしていません (要コア接続)</span>`;
                            }
                        }
                        LabUI.showTooltip(item, rect.left + rect.width / 2, rect.top, null, null, deployText);
                    };
                    cell.onmouseleave = () => LabUI.hideTooltip();

                    // Double click to deploy
                    cell.ondblclick = (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (!item.isDeployed && circuit.canDeployChip(x, y)) {
                            if (circuit.deployChip(x, y)) {
                                 this.render(); // Re-render this specific modal
                            }
                        }
                    };

                    gridContainer.appendChild(cell);
                } else {
                    // Empty Cell
                    const cell = document.createElement('div');
                    cell.className = 'grid-cell';
                    gridContainer.appendChild(cell);
                }
            }
        }
    }
}
