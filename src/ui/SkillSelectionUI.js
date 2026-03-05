/**
 * Manages the Skill Selection (Stage Settings) UI.
 */
export class SkillSelectionUI {
    static modal = null;
    static startSkillList = null;
    static currentSkillIcon = null;
    static currentSkillName = null;
    static currentSkillDesc = null;
    static selectedDifficulty = 'normal';
    static selectedSkillId = null;

    static init() {
        this.modal = document.getElementById('stage-settings-modal');
        this.startSkillList = document.getElementById('start-skill-list');
        this.currentSkillIcon = document.getElementById('current-skill-icon');
        this.currentSkillName = document.getElementById('current-skill-name');
        this.currentSkillDesc = document.getElementById('current-skill-desc');

        if (!this.modal) return;

        // Difficulty selection
        const diffOptions = this.modal.querySelectorAll('.diff-option');
        diffOptions.forEach(opt => {
            opt.onclick = () => {
                diffOptions.forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                this.selectedDifficulty = opt.dataset.difficulty;
                this.updateStartButtonText();
            };
        });

        // Tab Logic
        const tabButtons = this.modal.querySelectorAll('.stage-tab-btn');
        const tabContents = this.modal.querySelectorAll('.stage-tab-content');

        tabButtons.forEach(btn => {
            btn.onclick = () => {
                const tabId = btn.dataset.tab;
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                tabContents.forEach(content => {
                    const targetId = `tab-${tabId}`;
                    if (content.id === targetId) {
                        content.style.display = 'block';
                        content.classList.add('active');
                    } else {
                        content.style.display = 'none';
                        content.classList.remove('active');
                    }
                });
            };
        });
    }

    static updateStartButtonText() {
        const btnStart = document.getElementById('btn-start-adventure');
        if (!btnStart) return;

        const diffData = {
            easy: { label: 'イージー', color: '#00ffff' },
            normal: { label: 'ノーマル', color: '#adff2f' },
            hard: { label: 'ハード', color: '#ff4444' }
        };
        const data = diffData[this.selectedDifficulty] || diffData.normal;

        btnStart.innerHTML = `出発する<br><span style="font-size: 10px; color: ${data.color}; opacity: 0.9; margin-top: 4px; display: block; font-family: 'Meiryo', 'Hiragino Kaku Gothic ProN', sans-serif; font-weight: bold;">(${data.label})</span>`;
    }

    static show(game, skills, onStartCallback, onBackCallback) {
        if (!this.modal) this.init();
        if (!this.modal || !this.startSkillList) return;

        // Default to 'slash' if available, else first skill
        if (!this.selectedSkillId) {
            this.selectedSkillId = skills.some(s => s.id === 'slash') ? 'slash' : (skills.length > 0 ? skills[0].id : null);
        }

        const updateSkillDisplay = () => {
            const skill = skills.find(s => s.id === this.selectedSkillId);
            if (skill) {
                this.currentSkillIcon.src = skill.icon || '';
                this.currentSkillName.textContent = skill.name;
                if (this.currentSkillDesc) this.currentSkillDesc.textContent = skill.description || "";
            }
        };

        const renderSkillGrid = () => {
            this.startSkillList.innerHTML = '';
            skills.forEach(skill => {
                const card = document.createElement('div');
                card.className = 'start-skill-card';
                if (skill.id === this.selectedSkillId) card.classList.add('active');

                card.innerHTML = `<img src="${skill.icon || ''}" class="start-skill-icon">`;

                card.onclick = () => {
                    this.selectedSkillId = skill.id;
                    updateSkillDisplay();
                    this.startSkillList.querySelectorAll('.start-skill-card').forEach(c => c.classList.remove('active'));
                    card.classList.add('active');
                };

                this.startSkillList.appendChild(card);
            });
        };

        updateSkillDisplay();
        renderSkillGrid();

        // Reset to default tab (Skills)
        const tabButtons = this.modal.querySelectorAll('.stage-tab-btn');
        const skillsTabBtn = Array.from(tabButtons).find(b => b.dataset.tab === 'skills');
        if (skillsTabBtn) skillsTabBtn.click();

        this.updateStartButtonText();

        // Button Handlers
        const btnStart = document.getElementById('btn-start-adventure');
        const btnBack = document.getElementById('btn-back-to-title');

        if (btnStart) {
            btnStart.onclick = () => {
                this.hide();
                onStartCallback({ difficulty: this.selectedDifficulty, skillId: this.selectedSkillId });
            };
        }

        if (btnBack) {
            btnBack.onclick = () => {
                this.hide();
                if (onBackCallback) onBackCallback();
            };
        }

        this.modal.style.display = 'flex';
    }

    static hide() {
        if (this.modal) this.modal.style.display = 'none';
    }
}
