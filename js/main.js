//랜딩페이지 전환 & 지도 초기화

window.addEventListener('DOMContentLoaded', () => {
    const landing = document.getElementById('landing');
    const enterBtn = document.getElementById('enterBtn');


    // 진입 트리거 (버튼 클릭, 엔터, 스크롤)
    function enterMapPage() {
        if (landing.classList.contains('slide-right')) return;
        landing.classList.add('slide-left');
        setTimeout(() => {
            landing.style.display = 'none';
        }, 1000);
    }

    // 버튼
    if (enterBtn) enterBtn.addEventListener('click', enterMapPage);
    // 엔터
    window.addEventListener('keydown', e => {
        if (e.key === 'Enter') enterMapPage();
    });
    // 스크롤
    window.addEventListener('wheel', enterMapPage);
});


//로컬스토리지 관리
const storage = {
    get(key, def = []) {
        try {
            const data = JSON.parse(localStorage.getItem(key));
            if (!data || (Array.isArray(data) && data.length === 0)) {
                return def;
            }
            return Array.isArray(data) ? data : def;
        } catch {
            return def;
        }
    },
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }
};


// 검색 기록 관리
const $searchInput = document.getElementById('searchInput');
const $searchBtn = document.getElementById('searchBtn');
const $searchHistory = document.getElementById('searchHistory');

let searchHistory = [...new Set(storage.get('searchHistory', []))];

function renderSearchHistory() {
    const uniqueHistory = [...new Set(searchHistory)];
    if (uniqueHistory.length === 0) {
        $searchHistory.innerHTML = '';
        return;
    }

    $searchHistory.innerHTML = uniqueHistory
        .map(term => `
            <li>
                <span>${term}</span>
                <button data-term="${term}">✕</button>
            </li>
        `)
        .join('');
}

function addSearchTerm(term) {
    term = term.trim();
    if (!term) return;

    const idx = searchHistory.indexOf(term);
    if (idx !== -1) searchHistory.splice(idx, 1);

    searchHistory.unshift(term);
    if (searchHistory.length > 10) searchHistory = searchHistory.slice(0, 10);

    storage.set('searchHistory', [...new Set(searchHistory)]);
    renderSearchHistory();
}

function deleteSearchTerm(term) {
    searchHistory = searchHistory.filter(t => t !== term);
    storage.set('searchHistory', searchHistory);
    renderSearchHistory();
}

$searchBtn.addEventListener('click', () => {
    const val = $searchInput.value.trim();
    if (!val) return;
    addSearchTerm(val);
});

$searchHistory.addEventListener('click', e => {
    if (e.target.tagName === 'BUTTON') deleteSearchTerm(e.target.dataset.term);
    else if (e.target.tagName === 'SPAN') $searchInput.value = e.target.textContent;
});

$searchInput.addEventListener('focus', renderSearchHistory);
renderSearchHistory();



//즐겨찾기(찜) 목록 관리

const $favList = document.getElementById('favorite-list');
const $favSearch = document.getElementById('favSearch');
const $toggle = document.getElementById('toggleFavorites');
const $panel = document.getElementById('favorite-panel');
const $toggleIcon = $toggle?.querySelector('.toggle-icon');
const $toggleText = $toggle?.querySelector('span');

//[10-29:수정 -> favorites 기본값을 빈 배열로 초기화]
let favorites = storage.get('favorites', []);

renderFavorites();

function getPriorityColor(level) {
    switch (level) {
        case 1: return '#ff6b6b';
        case 2: return '#f9a825';
        case 3: return '#64b5f6';
        default: return '#ccc';
    }
}

//아코디언 콘텐츠
function renderFavorites(list = favorites) {
    list.sort((a, b) => a.priority - b.priority);

    // [10-29:수정 => 즐겨찾기 항목이 없을 때 안내문구 표시]
    // style.css - 443번 line 참고
    if (!list || list.length === 0) {
        $favList.innerHTML = `
            <li class="empty-message">
                <p>즐겨찾기된 곳이 없습니다. 추가해주세요!</p>
            </li>
        `;
        return;
    }

    // 즐겨찾기 항목이 있을 때만 리스트 렌더링
    $favList.innerHTML = list.map(f => `
        <li class="accordion-item" data-id="${f.id}">
            <button class="accordion-btn" type="button">
                <span class="fav-title">
                    <strong style="color:${getPriorityColor(f.priority)}">●</strong>
                    ${f.name}
                </span>
                <span class="arrow">
                    <img src="assets/icon/arrow-bottom.png" alt="화살표" class="arrow-bottom" />
                </span>
            </button>
            <div class="accordion-content">
                <p><strong>등록일:</strong> ${f.date}</p>

                ${f.phone ? `<p><strong>전화번호:</strong> 
                    <a href="tel:${f.phone}" class="fav-phone">${f.phone}</a>
                </p>` : ''}

                ${f.address ? `<p><strong>주소:</strong>${f.address}</p>` : ''}

                <div class="priority-control">
                    <label>우선순위:</label>
                    <select class="priority-select" data-id="${f.id}">
                        <option value="1" ${f.priority === 1 ? 'selected' : ''}>1 (높음)</option>
                        <option value="2" ${f.priority === 2 ? 'selected' : ''}>2 (보통)</option>
                        <option value="3" ${f.priority === 3 ? 'selected' : ''}>3 (낮음)</option>
                    </select>
                </div>

                <div class="fav-actions">
                    <button class="btn-map" data-id="${f.id}">지도에서 보기</button>
                    <button class="btn-delete" data-id="${f.id}">삭제</button>
                </div>
            </div>
        </li>
    `).join('');
}


// 우선순위 변경
function updatePriority(id, newPriority) {
    favorites = storage.get('favorites', []);
    const item = favorites.find(f => f.id === id);
    if (!item) return;
    item.priority = Number(newPriority);
    storage.set('favorites', favorites);
    renderFavorites();
}

// [10-29:수정 -> 즐겨찾기 패널에서 해당 업체 삭제 시 favorite 배열에서도 제거]
function deleteFavorite(id) {
    // 현재 즐겨찾기 목록 불러오기
    favorites = storage.get('favorites', []);

    // [10-29:수정 -> ID뿐만 아니라 이름도 보조 조건으로 매칭]
    const target = favorites.find(f => f.id === id);
    if (!target) return;

    // [10-29:수정 -> 정확히 일치하는 항목만 삭제]
    favorites = favorites.filter(f => f.id !== id && f.name !== target.name);

    // [10-29:수정 -> localStorage 반영 및 렌더링 갱신]
    storage.set('favorites', favorites);
    renderFavorites();

    // [10-29:수정 -> 지도 오버레이 찜 버튼 상태 동기화]
    const infoWindows = document.querySelectorAll('.bakeryInfoWindowCustom');
    infoWindows.forEach(box => {
        const title = box.querySelector('.bakeryTitle a');
        const btn = box.querySelector('.favorite-btn');
        if (!title || !btn) return;

        if (title.textContent.trim() === target.name) {
            btn.classList.remove('active');
        }
    });

    console.log(`'${target.name}' 즐겨찾기 및 찜 상태에서 제거됨`);
}

// 아코디언 클릭
let isSelectActive = false;

$favList.addEventListener('focusin', e => {
    if (e.target.matches('.priority-select')) isSelectActive = true;
});
$favList.addEventListener('focusout', e => {
    if (e.target.matches('.priority-select')) {
        setTimeout(() => (isSelectActive = false), 120);
    }
});

$favList.addEventListener('click', e => {
    const btn = e.target.closest('.accordion-btn');
    const delBtn = e.target.closest('.btn-delete');
    const mapBtn = e.target.closest('.btn-map');

    if (isSelectActive) return;

    // 삭제
    if (delBtn) {
        e.stopPropagation();
        const id = Number(delBtn.dataset.id);
        deleteFavorite(id);
        return;
    }

    // [10-29:수정] 지도에서 보기 클릭 시 실제 지도 이동 + 오버레이 표시
    if (mapBtn) {
        e.stopPropagation();
        const id = Number(mapBtn.dataset.id);
        const item = favorites.find(f => f.id === id);
        if (!item) return;

        // 지도 준비가 안 된 경우를 대비해서 저장만 해둠
        window.fromFavoriteFocus = true;
        window.focusPlace = item;

        // 지도 객체 존재 확인
        if (window.map && typeof kakao !== 'undefined') {
            // ② 즐겨찾기 항목에 좌표 정보가 없다면, 주소 → 좌표 변환
            if (!item.x || !item.y) {
                const geocoder = new kakao.maps.services.Geocoder();
                geocoder.addressSearch(item.address, (result, status) => {
                    if (status === kakao.maps.services.Status.OK) {
                        const coords = {
                            x: result[0].x,
                            y: result[0].y,
                            place_name: item.name,
                            address_name: item.address,
                            phone: item.phone || "",
                            id: item.id
                        };
                        // 전역 함수 호출로 이동 + 오버레이 표시
                        if (window.focusBakeryOnMap) window.focusBakeryOnMap(coords);
                    } else {
                        dialogHandler.showMOdalSimpleOk("위치 오류", `'${item.name}'의 주소를 찾을 수 없습니다.`);
                    }
                });
            } else {
                // ③ 이미 좌표가 있다면 바로 지도 포커스
                if (window.focusBakeryOnMap) window.focusBakeryOnMap(item);
            }
        } else {
            dialogHandler.showMOdalSimpleOk("지도 오류", "지도를 불러올 수 없습니다.");
        }

        return;
    }


    // 열기/닫기
    if (btn) {
        const item = btn.closest('.accordion-item');
        item.classList.toggle('active');
    }
});


['mousedown', 'click', 'focusin'].forEach(evt => {
    $favList.addEventListener(evt, e => {
        if (e.target.matches('.priority-select')) e.stopPropagation();
    });
});

$favList.addEventListener('change', e => {
    if (e.target.matches('.priority-select')) {
        const id = Number(e.target.dataset.id);
        updatePriority(id, e.target.value);
    }
});


$favSearch.addEventListener('input', e => {
    const q = e.target.value.trim();
    const filtered = favorites.filter(f => f.name.includes(q));
    renderFavorites(filtered);
});


if ($toggle && $panel) {
    $toggle.addEventListener('click', () => {

        // --- 1. 다른 패널 닫기 (상호 배타성 로직) ---

        // 검색 패널 닫기
        if ($searchPanel && $searchPanel.classList.contains('open')) {
            $searchPanel.classList.remove('open');
            // 검색 버튼의 UI를 닫힌 상태로 되돌립니다.
            if ($toggleSearchIcon) $toggleSearchIcon.src = 'assets/icon/arrow_left.png';
            if ($toggleSearchIcon) $toggleSearchIcon.alt = '열기';
        }

        // 리뷰 패널 닫기
        if ($reviewPanel && $reviewPanel.classList.contains('open')) {
            $reviewPanel.classList.remove('open');
            // 리뷰 버튼의 UI를 닫힌 상태로 되돌립니다.
            if ($toggleReview) $toggleReview.classList.remove('open');
        }

        // --- 2. 찜 목록 패널 토글 및 UI 업데이트 ---
        $panel.classList.toggle('open');
        if ($panel.classList.contains('open')) {
            if ($toggleIcon) $toggleIcon.src = 'assets/icon/arrow_right.png';
        } else {
            if ($toggleIcon) $toggleIcon.src = 'assets/icon/arrow_left.png';
        }
    });
}





//전역관리 : 윈도우 객체 속성으로 직접 등록해서 사용 [필요시 추후 수정]
window.renderFavorites = renderFavorites;
window.storage = storage;
window.favorites = favorites;


// 초기 렌더링
renderFavorites();
