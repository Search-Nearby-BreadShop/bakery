// ==============================
// 검색결과 패널 토글 기능
// ==============================
const $toggleSearch = document.getElementById('toggleSearch');
const $searchPanel = document.getElementById('search-panel');
const $searchResultsList = document.getElementById('search-results-list');

const $toggleSearchIcon = $toggleSearch?.querySelector('.toggle-icon');
const $toggleSearchText = $toggleSearch?.querySelector('span');

if ($toggleSearch && $searchPanel) {
    $toggleSearch.addEventListener('click', () => {

        // --- 1. 다른 패널 닫기 (상호 배타성 로직) ---

        // 찜 목록 패널 닫기
        if ($panel && $panel.classList.contains('open')) {
            $panel.classList.remove('open');
            // 찜 목록 버튼의 UI를 닫힌 상태로 되돌립니다.
            if ($toggleIcon) $toggleIcon.src = 'assets/icon/arrow_left.png';
        }

        // 리뷰 패널 닫기
        if ($reviewPanel && $reviewPanel.classList.contains('open')) {
            $reviewPanel.classList.remove('open');
            // 리뷰 버튼의 UI를 닫힌 상태로 되돌립니다.
            if ($toggleReview) $toggleReview.classList.remove('open');
        }

        // --- 2. 검색 패널 토글 및 UI 업데이트 ---
        $searchPanel.classList.toggle('open');

        if ($searchPanel.classList.contains('open')) {
            // 패널이 열렸을 때 (닫는 버튼 역할)
            if ($toggleSearchIcon) $toggleSearchIcon.src = 'assets/icon/arrow_right.png';
            if ($toggleSearchIcon) $toggleSearchIcon.alt = '닫기';
        } else {
            // 패널이 닫혔을 때 (여는 버튼 역할)
            if ($toggleSearchIcon) $toggleSearchIcon.src = 'assets/icon/arrow_left.png';
            if ($toggleSearchIcon) $toggleSearchIcon.alt = '열기';
        }
    });
}


// ==============================
// [10-29:수정] 검색결과 렌더링 함수 (append 지원 + 중복 방지)
// ==============================
function renderSearchResults(list, append = false) { // [10-29:수정] append 인자 추가

    if (!list || list.length === 0){
        $searchResultsList.innerHTML= `
            <li class="empty-message">
                <p>검색된 곳이 없습니다. 추가해주세요!</p>
            </li>
        `;
        return;
    }


    // [10-29:수정] 기존 place-id 목록 수집 → 중복 제거
    const existingIds = Array.from($searchResultsList.querySelectorAll('.result-item'))
        .map(el => el.dataset.placeId);


    const newItems = list.filter(place => !existingIds.includes(place.id));

    if (newItems.length === 0) return; // [10-29:수정] 모두 중복이면 추가 안 함

// console.log(newItems)
    const newHTML = newItems.map(place => `
     <li class="result-item" data-place-id="${place.id}">
            <button class="result-btn" type="button">
                <span class="fav-title">${place.place_name}</span>
                <span class="arrow">
                    <img src="assets/icon/arrow-bottom.png" alt="화살표" class="arrow-bottom" />
                </span>
            </button>
            <div class="result-content">
                <p><strong>주소:</strong> ${place.road_address_name || place.address_name}</p>
                ${place.phone ? `<p><strong>전화번호:</strong> ${place.phone}</p>` : ''}
                <div class="res-actions">
                    <button class="btn-map transfer" data-url="${place.place_url}" >매장이동</button>
                   <!-- data-place-name 제거, ID만 전달 -->
                   <button class="btn-delete btn-review-write" data-place-id="${place.id}">리뷰작성</button>
                </div>
            </div>
        </li>
    `).join('');

    // [10-29:수정] append 여부에 따라 추가 or 교체
    const emptyMsg=$searchResultsList.querySelector('.empty-message');
    if(emptyMsg)emptyMsg.remove();

    if (append) {
        $searchResultsList.insertAdjacentHTML('beforeend', newHTML);
    } else {
        $searchResultsList.innerHTML = newHTML;
    }

}


// ==============================
// [10-29:수정] 초기 로드시 저장된 결과 불러오기
// ==============================

const initialSearchResults = storage.get('bakeryResults', []);
renderSearchResults(initialSearchResults);



// ==============================
// [10-29:수정] localStorage 변경 시 자동 반영
// ==============================
window.addEventListener('storage', (e) => {
    if (e.key === 'bakeryResults') {
        const updated = JSON.parse(e.newValue || "[]");
        renderSearchResults(updated);
    }
});


// ==============================
// 클릭 이벤트 (아코디언, 지도 이동, 찜하기)
// ==============================
$searchResultsList.addEventListener('click', e => {
    const btn = e.target.closest('.result-btn');
    const transferBtn = e.target.closest('.btn-map.transfer');
    const reviewWriteBtn = e.target.closest('.btn-review-write');


    if (btn) {
        const item = btn.closest('.result-item');
        item.classList.toggle('active');
    }
    if (transferBtn) {
        e.stopPropagation(); // 이벤트 전파 중지
        const url = transferBtn.dataset.url; // data-url 속성에서 URL을 가져옵니다.
        if (url) {
            const newWindow = window.open(url, '_blank');
        } else {
            dialogHandler.showMOdalSimpleOk( 'Request Error', '유효한 주소가 없습니다.')
        }
        return;
    }

    if (reviewWriteBtn) {
        e.stopPropagation();
        const placeId = reviewWriteBtn.dataset.placeId;
        ReviewWriteClick(placeId);
        return;
    }
});

/*placeId - 리뷰를 작성하는 장소의 고유 ID*/
function ReviewWriteClick(placeId) {
    const allResult = JSON.parse(localStorage.getItem('bakeryResults')??[]) ;
    const placeInfo =   allResult .find(place => place.id === placeId);

    if (!placeInfo) {
        dialogHandler.showMOdalSimpleOk('오류', '장소 정보를 찾을 수 없습니다.');
        return;
    }

    const placeName = placeInfo.place_name;

    //리뷰 내용만 입력받는 폼을 구성합니다.
    dialogHandler.showModal({
        // 모달 제목에 클릭한 가게 이름 동적 삽입
        title: `${placeName}에 대한 리뷰 작성`,
        content: `
            <div class="___review-write-form">
                <p><strong>${placeName}</strong>에 대한 솔직한 리뷰를 작성해주세요.</p>
                <label class="-object-input-label" style="margin-top: 1rem;">
                    <span class="_caption">리뷰 내용</span>
                    <textarea required class="-object-input _field" name="comment" rows="5" maxlength="300"></textarea>
                </label>
            </div>
        `,
        isContentHtml: true,
        buttons: [
            {
                caption: '취소',
                // dialogHandler.hide 함수가 정의되어 있다고 가정합니다. (아마도 hideModal일 수 있음)
                onclick: ($modal) => dialogHandler.hideModal($modal)
            },
            {
                caption: '저장',
                onclick: ($modal) => {
                    const $form = $modal.querySelector('.___review-write-form');
                    const $commentInput = $form.querySelector('textarea[name="comment"]');
                    const comment = $commentInput ? $commentInput.value.trim() : '';
                    if (!comment) {
                        dialogHandler.showMOdalSimpleOk('경고', '리뷰 내용을 입력해주세요.');
                        return;
                    }

                    const reviews = JSON.parse(localStorage.getItem('bakeryReviews') ?? '[]');
                    const newReview = {
                        placeId: placeId,
                        placeName: placeName,
                        comment: comment,
                        date: new Date().toISOString()
                    };

                    reviews.push(newReview);
                    localStorage.setItem('bakeryReviews', JSON.stringify(reviews));

                    dialogHandler.hideModal($modal);

                    dialogHandler.showMOdalSimpleOk('완료', `${placeName}에 대한 리뷰가 저장되었습니다.`);
                }
            }
        ]
    });
}
