// 모달 관리 객체 : tmp
const modal = {
    $container: document.getElementById('modal-container'),
    $title: document.getElementById('modal-title'),
    $content: document.getElementById('modal-content'),
    $close: document.getElementById('modal-close'),

    // 모달 열기
    show(name, item, updatePriority, deleteFavorite) {
        this.$title.textContent = name;

        // 내용 구성
        this.$content.innerHTML = `
            <div class="modal-info">
                <p><strong>등록일시:</strong> ${item.date}</p>
                <p><strong>현재 우선순위:</strong> ${item.priority}</p>
            </div>

            <div class="priority-select-box">
                <label>우선순위를 선택하세요</label>
                <div class="select-wrapper">
                    <div class="circle-icon" style="background:${getPriorityColor(item.priority)}"></div>
                    <select id="prioritySelect">
                        <option value="1" ${item.priority === 1 ? 'selected' : ''}>높음</option>
                        <option value="2" ${item.priority === 2 ? 'selected' : ''}>보통</option>
                        <option value="3" ${item.priority === 3 ? 'selected' : ''}>낮음</option>
                    </select>
                </div>
            </div>

            <div class="modal-btn-row">
                <button class="modal-delete">삭제하기</button>
                <button class="modal-save">확인</button>
            </div>
        `;

        // 표시
        this.$container.classList.add('visible');

        // 이벤트 등록
        const $prioritySelect = this.$content.querySelector('#prioritySelect');
        const $circle = this.$content.querySelector('.circle-icon');
        const $delete = this.$content.querySelector('.modal-delete');
        const $save = this.$content.querySelector('.modal-save');

        // 드롭다운 변경 시 색상 실시간 반영
        $prioritySelect.addEventListener('change', e => {
            const newPriority = Number(e.target.value);
            $circle.style.background = getPriorityColor(newPriority);
        });

        // 확인 버튼 → 우선순위 업데이트
        $save.addEventListener('click', () => {
            const newPriority = Number($prioritySelect.value);
            updatePriority(item.id, newPriority);
            this.hide();
        });

        //  삭제 버튼
        $delete.addEventListener('click', () => {
            deleteFavorite(item.id);
            this.hide(); // 모달 닫기
        });

        // 닫기 버튼
        this.$close.onclick = () => this.hide();
    },

    // 모달 닫기
    hide() {
        this.$container.classList.remove('visible');
    }
};
