import { AetherLabManager } from '../AetherLabManager.js';
import { getFormattedEffect } from '../ui.js';

export class LabUI {
    static init(game) {
        this.game = game;
        this.currentTab = 'build';
        this.selectedChip = null;

        const modal = document.getElementById('lab-modal');
        const closeBtn = document.getElementById('btn-close-lab');
        const executeBtn = document.getElementById('btn-lab-execute');

        if (closeBtn) {
            closeBtn.onclick = () => this.close();
        }

        if (executeBtn) {
            executeBtn.onclick = () => this.executeAction();
        }

        const tabBtns = modal.querySelectorAll('.stage-tab-btn');
        tabBtns.forEach(btn => {
            btn.onclick = () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTab = btn.dataset.tab;
                this.selectedChip = null;
                this.render();
            };
        });
    }

    static open() {
        const modal = document.getElementById('lab-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.toggleTitleUI(false);
            this.currentTab = 'build'; // Default
            this.selectedChip = null;
            this.render();
        }
    }

    static toggleTitleUI(show) {
        const menu = document.querySelector('.title-menu');
        const header = document.querySelector('.title-header');
        const hs = document.getElementById('title-highscore-container');
        const sideMenu = document.querySelector('.title-side-menu');
        const display = show ? 'flex' : 'none';
        if (menu) menu.style.display = display;
        if (header) header.style.display = display;
        if (hs) hs.style.display = display;
        if (sideMenu) sideMenu.style.display = display;
    }

    static close() {
        const modal = document.getElementById('lab-modal');
        if (modal) {
            modal.style.display = 'none';
            this.toggleTitleUI(true);
        }
    }

    static render() {
        this.updateMaterialDisplay();
        this.renderTabContent();
        this.renderFocusArea();
    }

    static updateMaterialDisplay() {
        const shardEl = document.getElementById('lab-shard-value');
        const fragmentEl = document.getElementById('lab-fragment-value');
        if (shardEl) shardEl.textContent = this.game.player.aetherShards;
        if (fragmentEl) fragmentEl.textContent = this.game.player.aetherFragments;
    }

    static renderTabContent() {
        const container = document.getElementById('lab-tab-content');
        if (!container) return;
        container.innerHTML = '';

        if (this.currentTab === 'build') {
            this.renderBuildTab(container);
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'lab-item-grid';

        let chips = [];
        if (this.currentTab === 'upgrade') {
            chips = this.game.player.circuit.ownedChips.filter(c => c.isIdentified && c.level < 10);
        } else if (this.currentTab === 'dismantle') {
            chips = this.game.player.circuit.ownedChips.filter(c => c.isIdentified);
        } else if (this.currentTab === 'synthesis') {
            this.renderSynthesisOptions(grid);
            container.appendChild(grid);
            return;
        }

        if (chips.length === 0) {
            container.innerHTML = `<div class="detail-placeholder">対象のチップがありません</div>`;
            return;
        }

        chips.forEach(chip => {
            const card = document.createElement('div');
            card.className = `chip-item rarity-${chip.data.rarity || 'common'}`;
            if (this.selectedChip === chip) card.classList.add('selected');

            card.innerHTML = `
                <div class="chip-name">${chip.data.name}</div>
                <div class="chip-rank-dots">
                    ${Array.from({ length: 10 }).map((_, i) => `<span class="dot ${i < chip.level ? 'filled' : ''}"></span>`).join('')}
                </div>
            `;

            card.onclick = () => {
                this.selectedChip = chip;
                this.render();
            };

            grid.appendChild(card);
        });

        container.appendChild(grid);
    }

    static renderBuildTab(container) {
        const circuit = this.game.player.circuit;

        // Capacity Gauge
        const percent = Math.min((circuit.usedCapacity / circuit.maxCapacity) * 100, 100);
        const header = document.createElement('div');
        header.className = 'circuit-header';
        header.style.padding = '0 10px 10px 0';
        header.innerHTML = `
            <div class="capacity-gauge-container">
                <span style="font-size: 8px;">容量出力: ${circuit.usedCapacity} / ${circuit.maxCapacity}</span>
                <div class="capacity-bar-track" style="height: 6px;">
                    <div class="capacity-bar-fill" style="width: ${percent}%;"></div>
                </div>
            </div>
        `;
        container.appendChild(header);

        const main = document.createElement('div');
        main.className = 'circuit-main';
        main.style.flexDirection = 'column';
        main.style.gap = '10px';

        // Slots
        const slotSection = document.createElement('div');
        slotSection.innerHTML = '<div class="grid-label">回路スロット</div>';
        const slotsGrid = document.createElement('div');
        slotsGrid.className = 'chip-slots';
        slotsGrid.style.gridTemplateColumns = 'repeat(auto-fill, 60px)';
        slotsGrid.style.gridTemplateRows = 'auto';

        circuit.slots.forEach((chip, idx) => {
            if (chip) {
                const item = document.createElement('div');
                item.className = `chip-item rarity-${chip.data.rarity || 'common'}`;
                if (this.selectedChip === chip) item.classList.add('selected');
                item.innerHTML = `
                    <div class="chip-name">${chip.data.name}</div>
                    <div class="chip-rank-dots">
                        ${Array.from({ length: 10 }).map((_, i) => `<span class="dot ${i < chip.level ? 'filled' : ''}"></span>`).join('')}
                    </div>
                `;
                item.onclick = () => {
                    this.selectedChip = chip;
                    this.render();
                };
                slotsGrid.appendChild(item);
            } else {
                const empty = document.createElement('div');
                empty.className = 'chip-slot-empty';
                empty.textContent = 'Empty';
                slotsGrid.appendChild(empty);
            }
        });
        slotSection.appendChild(slotsGrid);
        main.appendChild(slotSection);

        // Inventory
        const invSection = document.createElement('div');
        invSection.innerHTML = '<div class="grid-label">所持チップ</div>';
        const invGrid = document.createElement('div');
        invGrid.className = 'chip-list';
        invGrid.style.gridTemplateColumns = 'repeat(auto-fill, 60px)';
        invGrid.style.maxHeight = '150px';

        circuit.ownedChips.forEach(chip => {
            const item = document.createElement('div');
            item.className = `chip-item rarity-${chip.data.rarity || 'common'}`;
            if (circuit.slots.includes(chip)) item.classList.add('equipped');
            if (this.selectedChip === chip) item.classList.add('selected');
            item.innerHTML = `
                <div class="chip-name">${chip.data.name}</div>
                <div class="chip-rank-dots">
                    ${Array.from({ length: 10 }).map((_, i) => `<span class="dot ${i < chip.level ? 'filled' : ''}"></span>`).join('')}
                </div>
            `;
            item.onclick = () => {
                this.selectedChip = chip;
                this.render();
            };
            invGrid.appendChild(item);
        });
        invSection.appendChild(invGrid);
        main.appendChild(invSection);

        container.appendChild(main);
    }

    static renderSynthesisOptions(grid) {
        const categories = ['洞察', '技巧', '耐久', '俊敏'];
        categories.forEach(cat => {
            const card = document.createElement('div');
            card.className = 'chip-item synthesis-card';
            if (this.selectedSynthesisCategory === cat) card.classList.add('selected');

            card.innerHTML = `
                <div class="chip-name">${cat}</div>
                <div style="font-size: 7px; color: #888; margin-top: 2px;">合成</div>
            `;

            card.onclick = () => {
                this.selectedSynthesisCategory = cat;
                this.selectedChip = null;
                this.render();
            };
            grid.appendChild(card);
        });
    }

    static renderFocusArea() {
        const container = document.getElementById('lab-focus-area');
        const executeBtn = document.getElementById('btn-lab-execute');
        if (!container) return;
        container.innerHTML = '';

        const content = document.createElement('div');
        content.className = 'lab-focus-content';

        if (this.currentTab === 'synthesis' && this.selectedSynthesisCategory) {
            this.renderSynthesisFocus(content);
            if (executeBtn) {
                executeBtn.textContent = '合成する';
                executeBtn.style.display = 'block';
            }
        } else if (this.selectedChip) {
            this.renderItemFocus(content);
            if (executeBtn) {
                if (this.currentTab === 'build') {
                    const isEquipped = this.game.player.circuit.slots.includes(this.selectedChip);
                    executeBtn.textContent = isEquipped ? '解除する' : '装着する';
                    executeBtn.style.display = 'block';
                } else if (this.currentTab === 'upgrade') {
                    executeBtn.textContent = '強化する';
                    executeBtn.style.display = 'block';
                } else if (this.currentTab === 'dismantle') {
                    executeBtn.textContent = '分解する';
                    executeBtn.style.display = 'block';
                }
            }
        } else {
            content.innerHTML = `<div class="detail-placeholder">項目を選択してください</div>`;
            if (executeBtn) executeBtn.style.display = 'none';
        }

        container.appendChild(content);
    }

    static renderItemFocus(content) {
        const chip = this.selectedChip;
        const title = document.createElement('div');
        title.className = `lab-focus-title rarity-${chip.data.rarity || 'common'}`;
        title.textContent = chip.data.name;
        content.appendChild(title);

        const desc = document.createElement('div');
        desc.className = 'lab-focus-desc';
        desc.innerHTML = `${chip.data.description}${getFormattedEffect(chip)}`;
        content.appendChild(desc);

        if (this.currentTab === 'build') {
            const stats = document.createElement('div');
            stats.className = 'lab-cost-display';
            stats.innerHTML = `<div style="font-size: 8px; color: #888; margin-bottom: 5px;">チップ詳細</div>
                <div class="cost-row">
                    <span>カテゴリー:</span>
                    <span>${chip.data.category}</span>
                </div>
                <div class="cost-row">
                    <span>必要容量:</span>
                    <span style="color: #00ffff;">${chip.getCurrentCost()}</span>
                </div>`;
            content.appendChild(stats);
            return;
        }

        // Costs
        let costLabel = '';
        let costData = { gold: 0, fragments: 0 };
        if (this.currentTab === 'upgrade') {
            costLabel = '強化コスト (Lv.' + chip.level + ' → ' + (chip.level + 1) + ')';
            costData = AetherLabManager.getUpgradeCost(chip);
        } else if (this.currentTab === 'dismantle') {
            costLabel = '分解報酬';
            costData = AetherLabManager.getDismantleYield(chip);
        }

        const costDisplay = document.createElement('div');
        costDisplay.className = 'lab-cost-display';
        costDisplay.innerHTML = `<div style="font-size: 8px; color: #888; margin-bottom: 5px;">${costLabel}</div>`;

        if (this.currentTab === 'dismantle') {
            costDisplay.innerHTML += `
                <div class="cost-row sufficient">
                    <div class="cost-label-with-icon">
                        <img src="assets/ui/aether_fragment.png" class="currency-icon"> 報酬
                    </div>
                    <span>+${costData.fragments}</span>
                </div>
            `;
        } else {
            const goldOk = this.game.player.aetherShards >= costData.gold;
            const shardOk = this.game.player.aetherFragments >= costData.fragments;

            costDisplay.innerHTML += `
                <div class="cost-row ${goldOk ? 'sufficient' : 'insufficient'}">
                    <div class="cost-label-with-icon">
                        <img src="assets/ui/aether_shard.png" class="currency-icon">
                    </div>
                    <span>${costData.gold}</span>
                </div>
                <div class="cost-row ${shardOk ? 'sufficient' : 'insufficient'}">
                    <div class="cost-label-with-icon">
                        <img src="assets/ui/aether_fragment.png" class="currency-icon">
                    </div>
                    <span>${costData.fragments}</span>
                </div>
            `;
        }
        content.appendChild(costDisplay);
    }

    static renderSynthesisFocus(content) {
        const title = document.createElement('div');
        title.className = 'lab-focus-title';
        title.textContent = this.selectedSynthesisCategory + ' チップ合成';
        content.appendChild(title);

        const desc = document.createElement('div');
        desc.className = 'lab-focus-desc';
        desc.textContent = '指定されたカテゴリーのランダムなチップを生成します。';
        content.appendChild(desc);

        const costDisplay = document.createElement('div');
        costDisplay.className = 'lab-cost-display';
        const costData = { gold: 200, fragments: 20 };
        const goldOk = this.game.player.aetherShards >= costData.gold;
        const shardOk = this.game.player.aetherFragments >= costData.fragments;

        costDisplay.innerHTML = `
            <div style="font-size: 8px; color: #888; margin-bottom: 5px;">合成コスト</div>
            <div class="cost-row ${goldOk ? 'sufficient' : 'insufficient'}">
                <div class="cost-label-with-icon">
                    <img src="assets/ui/aether_shard.png" class="currency-icon">
                </div>
                <span>${costData.gold}</span>
            </div>
            <div class="cost-row ${shardOk ? 'sufficient' : 'insufficient'}">
                <div class="cost-label-with-icon">
                    <img src="assets/ui/aether_fragment.png" class="currency-icon">
                </div>
                <span>${costData.fragments}</span>
            </div>
        `;
        content.appendChild(costDisplay);
    }

    static executeAction() {
        const player = this.game.player;
        let success = false;

        if (this.currentTab === 'build' && this.selectedChip) {
            const circuit = player.circuit;
            const isEquipped = circuit.slots.includes(this.selectedChip);
            if (isEquipped) {
                const idx = circuit.slots.indexOf(this.selectedChip);
                circuit.unequipChip(idx);
                success = true;
            } else {
                const emptyIdx = circuit.slots.indexOf(null);
                if (emptyIdx !== -1) {
                    success = circuit.equipChip(this.selectedChip, emptyIdx);
                }
            }
        } else if (this.currentTab === 'upgrade' && this.selectedChip) {
            success = AetherLabManager.upgradeChip(player, this.selectedChip);
        } else if (this.currentTab === 'dismantle' && this.selectedChip) {
            success = AetherLabManager.dismantleChip(player, this.selectedChip);
            if (success) this.selectedChip = null;
        } else if (this.currentTab === 'synthesis' && this.selectedSynthesisCategory) {
            success = AetherLabManager.synthesisChip(player, this.selectedSynthesisCategory);
        }

        if (success) {
            this.render();
        } else {
            console.warn("Lab Action Failed: Insufficient resources or no item selected.");
        }
    }
}
