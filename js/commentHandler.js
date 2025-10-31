// 리뷰 패널 관련 DOM 요소 가져오기
const $toggleReview = document.getElementById('toggleReview');
const $reviewPanel = document.getElementById('review-panel');
const $reviewResultList = document.getElementById('review-results-list');
const $sortReviews = document.querySelector('.review-header .date');

// =================================================================
// 현재 선택된 정렬 값(1 또는 2)
// =================================================================
const getCurrentSortValue = () => {
    // $sortReviews가 정의되어 있으면 현재 값을, 아니면 기본값 '1'(최신순)을 반환
    return $sortReviews ? $sortReviews.value : '1';
};


// =================================================================
// 리뷰 삭제 로직
// =================================================================

function deleteReview($itemToDelete) {

    const reviewId = $itemToDelete.dataset.reviewId;

    if (!reviewId) {
        dialogHandler.showMOdalSimpleOk('Error','삭제할 리뷰 ID를 li 요소에서 찾을 수 없거나 ID가 유효하지 않습니다.')
        return;
    }


    let reviews = JSON.parse(localStorage.getItem('bakeryReviews') ?? '[]');


    const updatedReviews = reviews.filter(review => review.date !== reviewId);


    localStorage.setItem('bakeryReviews', JSON.stringify(updatedReviews));


    $itemToDelete.remove();


    if (updatedReviews.length === 0) {
        renderReviews(getCurrentSortValue()); // 정렬 순서를 유지하며 렌더링
    }
    console.log(`리뷰 ID: ${reviewId} 삭제 완료.`);
}




function editReview($itemToEdit) {
    const reviewId = $itemToEdit.dataset.reviewId;


    let reviews = JSON.parse(localStorage.getItem('bakeryReviews') ?? '[]');
    const existingReviewIndex = reviews.findIndex(review => review.date === reviewId);

    if (existingReviewIndex === -1) {
        dialogHandler.showMOdalSimpleOk('오류', '수정할 리뷰 정보를 찾을 수 없습니다.');
        return;
    }

    const existingReview = reviews[existingReviewIndex];

    dialogHandler.showModal({
        title: `${existingReview.placeName} 리뷰 수정`,
        content: `
            <div class="___review-write-form">
                <p><strong>${existingReview.placeName}</strong> 리뷰를 수정해주세요.</p>
                <label class="-object-input-label" style="margin-top: 1rem;">
                    <span class="_caption">리뷰 내용</span>
                    <textarea required class="-object-input _field" name="comment" rows="5" maxlength="300">${existingReview.comment}</textarea>
                </label>
            </div>
        `,
        isContentHtml: true,
        buttons: [
            {
                caption: '취소',
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

                    // 기존 리뷰 객체 업데이트
                    reviews[existingReviewIndex].comment = comment;
                    reviews[existingReviewIndex].date = new Date().toISOString(); // 수정 시간 갱신

                    localStorage.setItem('bakeryReviews', JSON.stringify(reviews));

                    dialogHandler.hideModal($modal);
                    dialogHandler.showMOdalSimpleOk('완료', '리뷰가 수정되었습니다.');

                    // 리뷰 수정 후 목록 갱신 (리뷰 패널이 열려 있다면)
                    if ($reviewPanel.classList.contains('open')) {
                        renderReviews(getCurrentSortValue());
                    }
                }
            }
        ]
    });
}

// =================================================================
// 리뷰 패널 토글 리스너
// =================================================================

if ($toggleReview && $reviewPanel) {
    $toggleReview.addEventListener('click', () => {

        // 찜 목록 패널 닫기
        if (window.$panel && window.$panel.classList.contains('open')) {
            window.$panel.classList.remove('open');
            if (window.$toggleIcon) window.$toggleIcon.src = 'assets/icon/arrow_left.png';
        }
        // 검색 패널 닫기
        if (window.$searchPanel && window.$searchPanel.classList.contains('open')) {
            window.$searchPanel.classList.remove('open');
            if (window.$toggleSearchIcon) window.$toggleSearchIcon.src = 'assets/icon/arrow_left.png';
            if (window.$toggleSearchIcon) window.$toggleSearchIcon.alt = '열기';
        }

        $reviewPanel.classList.toggle('open');

        if ($reviewPanel.classList.contains('open')) {

            renderReviews(getCurrentSortValue());
            $toggleReview.classList.add('open');
        } else {
            $toggleReview.classList.remove('open');
        }
    });
}

function renderReviews(sortValue = '1') {

    const $reviewResultsList = document.getElementById('review-results-list');

    const reviews = JSON.parse(localStorage.getItem('bakeryReviews') ?? '[]');

    // if (sortValue === '2') {
    //     reviews.reverse();
    // }

    reviews.sort((a, b) => {
        const dateA = Date.parse(a.date) || 0;
        const dateB = Date.parse(b.date) || 0;

        if (sortValue === '1') {
            // 최신순 (최근 수정된 게 위)
            return dateB - dateA;
        } else if (sortValue === '2') {
            // 오래된 순
            return dateA - dateB;
        }
        return 0;
    });

    $reviewResultsList.innerHTML = '';

    if (!reviews || reviews.length === 0) {
        $reviewResultsList.innerHTML = `
            <li class="review-item">
                <button class="review-btn" type="button" disabled>
                 작성된 리뷰가 없습니다
                </button>
            </li>`
    }
    for (const review of reviews) {

        const dateString = new Date(review.date).toLocaleTimeString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        const reviewHtml = `
             <li class="review-item" data-place-id="${review.placeId}" data-review-id="${review.date}">
                <button class="review-btn" type="button">
                    <span class="fav-title">${review.placeName}</span>
                    <span class="arrow">
                     <img src="assets/icon/arrow-bottom.png" alt="화살표" class="arrow-bottom" />
                    </span>
                </button>
                <div class="review-content">
                    <p><strong>작성일:</strong> ${dateString}</p>
                    <p class="review-comment">${review.comment}</p>
                    
                     <div class="rev-actions">
                   <button class="btn-map transfer" data-review-id="${review.date}">수정하기</button>
                   <button class="btn-delete btn-delete-review" data-review-id="${review.date}">삭제하기</button>
                    </div>
                </div>
            </li>
        `;
        $reviewResultsList.insertAdjacentHTML('beforeend', reviewHtml);
    }
}


if ($sortReviews) {
    $sortReviews.addEventListener('change', (e) => {
        // select 값이 변경되면 해당 값을 인수로 renderReviews 호출
        renderReviews(e.target.value);
    });
}


$reviewResultList.addEventListener('click', e => {
    const btn = e.target.closest('.review-btn');
    const deleteReviewBtn = e.target.closest('.btn-delete-review');
    const editReviewBtn = e.target.closest('.btn-map.transfer'); // 수정 버튼

    if (deleteReviewBtn) {
        e.stopPropagation();

        // 클릭된 버튼의 가장 가까운 상위 li 요소를 찾습니다.
        const $itemToDelete = deleteReviewBtn.closest('.review-item');

        if ($itemToDelete) {
            deleteReview($itemToDelete);
        } else {
            console.error("삭제할 리뷰 항목(li)을 찾을 수 없습니다.");
        }
        return;
    }

    if (editReviewBtn) {
        e.stopPropagation();
        const $itemToEdit = editReviewBtn.closest('.review-item');

        if ($itemToEdit) {
            editReview($itemToEdit);
        } else {
            console.error("수정할 리뷰 항목(li)을 찾을 수 없습니다.");
        }
        return;
    }


    // 열기/닫기
    if (btn) {
        const item = btn.closest('.review-item');
        item.classList.toggle('active');
    }
});

renderReviews(getCurrentSortValue());
