/**
 * Manages the Skill Selection (Stage Settings) UI.
 */
import { SaveManager } from '../SaveManager.js';

export class SkillSelectionUI {
    static modal = null;
    static startSkillList = null;
    static currentSkillIcon = null;
    static currentSkillName = null;
    static currentSkillDesc = null;
    static currentTab = 'normal'; // default category

    // Stores selected skill IDs for each category
    static selectedSkills = {
        normal: 'slash',
        primary1: null,
        primary2: null,
        secondary: null,
        ultimate: null
    };

    static init() {
        this.modal = document.getElementById('stage-settings-modal');
        this.startSkillList = document.getElementById('start-skill-list');
        this.currentSkillIcon = document.getElementById('current-skill-icon');
        this.currentSkillName = document.getElementById('current-skill-name');
        this.currentSkillDesc = document.getElementById('current-skill-desc');

        if (!this.modal) return;

        // Tab Logic (Categories)
        const tabButtons = this.modal.querySelectorAll('.stage-tab-btn');
        tabButtons.forEach(btn => {
            btn.onclick = () => {
                this.currentTab = btn.dataset.tab;
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Refresh list based on category
                this.refreshUI();
            };
        });
    }

    static refreshUI() {
        if (!window._lastSkills) return;
        
        const filteredSkills = window._lastSkills.filter(s => {
            // Check if unlocked for STARTING equipment
            if (!SaveManager.isStartingSkillUnlocked(s.id)) return false;

            // Mapping UI tab to technical skill type
            if (this.currentTab === 'normal') return s.type === 'normal';
            if (this.currentTab === 'primary1' || this.currentTab === 'primary2') return s.type === 'primary';
            if (this.currentTab === 'secondary') return s.type === 'secondary';
            if (this.currentTab === 'ultimate') return s.type === 'ultimate';
            return false;
        });

        this.renderSkillGrid(filteredSkills);
        this.updateSkillDisplay(window._lastSkills);
    }

    static updateSkillDisplay(allSkills) {
        const selectedId = this.selectedSkills[this.currentTab];
        const skill = allSkills.find(s => s.id === selectedId);
        
        if (skill) {
            this.currentSkillIcon.src = skill.icon || '';
            this.currentSkillName.textContent = skill.name;
            if (this.currentSkillDesc) this.currentSkillDesc.textContent = skill.description || "";
        } else {
            this.currentSkillIcon.src = '';
            this.currentSkillName.textContent = '未選択';
            if (this.currentSkillDesc) this.currentSkillDesc.textContent = 'このカテゴリのスキルを選択してください。';
        }
    }

    static renderSkillGrid(skills) {
        this.startSkillList.innerHTML = '';
        const selectedId = this.selectedSkills[this.currentTab];

        skills.forEach(skill => {
            const card = document.createElement('div');
            card.className = 'start-skill-card';
            if (skill.id === selectedId) card.classList.add('active');

            card.innerHTML = `<img src="${skill.icon || ''}" class="start-skill-icon">`;

            card.onclick = () => {
                this.selectedSkills[this.currentTab] = skill.id;
                this.updateSkillDisplay(window._lastSkills);
                this.startSkillList.querySelectorAll('.start-skill-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
            };

            this.startSkillList.appendChild(card);
        });

        // Add an "empty" slot for optional skills
        if (this.currentTab !== 'normal') {
            const emptyCard = document.createElement('div');
            emptyCard.className = 'start-skill-card empty-slot';
            if (!selectedId) emptyCard.classList.add('active');
            emptyCard.innerHTML = '<div style="font-size: 20px; color: #555;">×</div>';
            emptyCard.onclick = () => {
                this.selectedSkills[this.currentTab] = null;
                this.updateSkillDisplay(window._lastSkills);
                this.startSkillList.querySelectorAll('.start-skill-card').forEach(c => c.classList.remove('active'));
                emptyCard.classList.add('active');
            }
            this.startSkillList.appendChild(emptyCard);
        }
    }

    static show(game, skills, onStartCallback, onBackCallback) {
        if (!this.modal) this.init();
        if (!this.modal || !this.startSkillList) return;

        window._lastSkills = skills; // Store for refresh

        // Reset to normal tab
        this.currentTab = 'normal';
        const tabButtons = this.modal.querySelectorAll('.stage-tab-btn');
        tabButtons.forEach(b => {
            if (b.dataset.tab === 'normal') b.classList.add('active');
            else b.classList.remove('active');
        });

        this.refreshUI();

        // Button Handlers
        const btnStart = document.getElementById('btn-start-adventure');
        const btnBack = document.getElementById('btn-back-to-title');

        if (btnStart) {
            btnStart.onclick = () => {
                this.hide();
                onStartCallback({ 
                    difficulty: game.difficulty || 'normal', 
                    skills: { ...this.selectedSkills } 
                });
            };
            btnStart.textContent = "設定を反映";
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
