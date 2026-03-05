/**
 * Manages the Skill Reward Selection UI (e.g. from Treasure Chests).
 */
export class SkillRewardUI {
    static modal = null;
    static cardsContainer = null;

    static init() {
        this.modal = document.getElementById('skill-selection-modal');
        this.cardsContainer = document.getElementById('skill-selection-cards');
    }

    /**
     * Shows the skill selection modal with 3 random skills.
     * @param {Array} skills - List of skill data objects.
     * @param {Function} onSelectCallback - Called when a skill is clicked.
     */
    static show(skills, onSelectCallback) {
        if (!this.modal) this.init();
        if (!this.modal || !this.cardsContainer) return;

        // Clear previous
        this.cardsContainer.innerHTML = '';

        skills.forEach(skill => {
            const card = document.createElement('div');
            card.className = 'skill-card';
            card.dataset.type = skill.type; // for styling

            // Icon
            const icon = document.createElement('img');
            icon.className = 'skill-card-icon';
            icon.src = skill.icon || 'assets/icon_unknown.png';
            icon.onerror = () => { icon.style.display = 'none'; };
            card.appendChild(icon);

            // Name
            const name = document.createElement('div');
            name.className = 'skill-card-name';
            name.textContent = skill.name;
            card.appendChild(name);

            // Type
            const type = document.createElement('div');
            type.className = 'skill-card-type';
            const typeMap = {
                normal: '通常スキル',
                primary: 'メインスキル',
                secondary: 'サブスキル',
                ultimate: 'アルティメット'
            };
            type.textContent = typeMap[skill.type] || skill.type.toUpperCase();
            card.appendChild(type);

            // Description
            const desc = document.createElement('div');
            desc.className = 'skill-card-desc';
            desc.textContent = skill.description || '説明がありません。';
            card.appendChild(desc);

            // Click Handler
            card.addEventListener('click', () => {
                this.hide();
                if (onSelectCallback) onSelectCallback(skill);
            });

            this.cardsContainer.appendChild(card);
        });

        this.modal.style.display = 'flex';
    }

    /**
     * Hides the skill selection modal.
     */
    static hide() {
        if (this.modal) {
            this.modal.style.display = 'none';
            if (this.cardsContainer) this.cardsContainer.innerHTML = '';
        }
    }
}
