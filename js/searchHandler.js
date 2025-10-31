// 검색버튼이 눌리거나 엔터를 치는 경우 searchlist 패널이 바로뜨게 해야함
function initMapSearch(map, userPosition) {
    let markers = []; // 마커 + 오버레이 저장용
    const bakeryImageSrc = '../assets/images/markup.png';
    let activeMarker = null;

    // ===== 마커 제거 =====
    function removeMarkers() {
        for (let i = 0; i < markers.length; i++) {
            if (markers[i].markerOverlay) markers[i].markerOverlay.setMap(null);
            if (markers[i].overlay) markers[i].overlay.setMap(null);
        }
        markers = [];
        activeMarker = null;
    }

    // ===== 오버레이 닫기 =====
    function closeOverlay() {
        markers.forEach(m => {
            if (m.overlay) m.overlay.setMap(null);
        });
        activeMarker = null;
    }

    // ===== 검색 함수 =====
    function searchByKeyword(keyword, center, radius = 5000) {
        const xhr = new XMLHttpRequest();
        const REST_API_KEY = "4f06c4d97874ff86be3d1acdd4846b17";
        const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(keyword)}&x=${center.getLng()}&y=${center.getLat()}&radius=${radius}`;
        xhr.open("GET", url);
        xhr.setRequestHeader("Authorization", `KakaoAK ${REST_API_KEY}`);

        xhr.onreadystatechange = () => {
            if (xhr.readyState !== XMLHttpRequest.DONE) return;
            const status = xhr.status;

            if (status < 200 || status >= 300) {
                placesSearchCB(null, 'ERROR');
                return;
            }

            const response = JSON.parse(xhr.responseText);
            if (response.documents.length === 0) {
                placesSearchCB(null, 'ZERO_RESULT');
                return;
            }

            placesSearchCB(response.documents, 'OK');
        };

        xhr.onerror = () => dialogHandler.showMOdalSimpleOk('Network Error', '검색 중 오류가 발생했습니다.');

        xhr.send();
    }

    // ===== 검색 콜백 =====
    function placesSearchCB(data, status) {
        removeMarkers();
        closeOverlay();

        if (status === 'OK') {
            const bakeryKeywords = ['빵', '베이커리', '제과', '베이글', '도넛', '디저트', '케이크'];
            let filtered = data.filter(p =>
                bakeryKeywords.some(word => (p.category_name || '').includes(word))
            );

            // [10-29:수정] 검색 시 기존 검색결과(localStorage) 비우기
            localStorage.removeItem('bakeryResults');

            if (filtered.length > 0) {
                // [10-29:수정] 검색결과 전체를 localStorage에 저장하지 않음 (초기화만)
                if (window.renderSearchResults) {
                    window.renderSearchResults([], false); // 패널 초기화
                }

                // [10-29:수정] 검색결과 패널 열기 및 닫힘 상태 해제
                const $searchPanel = document.getElementById('search-panel');
                if ($searchPanel) {
                    $searchPanel.classList.add('open');
                    $searchPanel.classList.remove('collapsed');
                }

                // 지도에 마커 표시
                filtered.forEach(displayMarker);
            } else {
                // 검색 결과가 없을 때 저장된 항목 삭제
                localStorage.removeItem('bakeryResults');
                dialogHandler.showMOdalSimpleOk('Result Error', '검색결과가 없습니다.');
            }
        } else if (status === 'ZERO_RESULT') {
            dialogHandler.showMOdalSimpleOk('Type Error', '일치하는 검색결과가 없습니다.');
        } else {
            dialogHandler.showMOdalSimpleOk('Search Error', '검색 중 오류가 발생했습니다.');
        }
    }

    // ===== 마커 표시 =====
    function displayMarker(place) {
        const position = new kakao.maps.LatLng(place.y, place.x);
        let markerContent = document.createElement('div');
        markerContent.className = 'custom-marker';
        markerContent.innerHTML = `<img src="${bakeryImageSrc}" alt="${place.place_name}">`;

        let markerOverlay = new kakao.maps.CustomOverlay({
            map,
            position,
            content: markerContent,
            xAnchor: 0.5,
            yAnchor: 1.0
        });

        const markerInfo = { markerOverlay, placeData: place, overlay: null };
        markers.push(markerInfo);

        markerContent.addEventListener('click', e => {
            e.stopPropagation();
            displayPlaceInfo(place, markerInfo);
        });
    }

    // ===== 장소 정보 오버레이 표시 =====
    function displayPlaceInfo(place, markerInfo) {

        // [10-29:수정] 즐겨찾기에서 호출 시 검색결과 추가 방지
        if (window.fromFavoriteFocus === true) {
            console.log('즐겨찾기에서 호출됨 — 검색결과 패널에는 추가하지 않음');
            window.fromFavoriteFocus = false; // 한 번만 적용
        } else {
            // 기존 검색결과 패널 추가 로직
            if (window.renderSearchResults) {
                const $searchResultsList = document.getElementById('search-results-list');
                const existingIds = Array.from($searchResultsList?.querySelectorAll('.accordion-item') || [])
                    .map(item => item.dataset.placeId);

                if (!existingIds.includes(place.id)) {
                    window.renderSearchResults([place], true); // append = true → 누적 모드
                }

                const $searchPanel = document.getElementById('search-panel');
                if ($searchPanel) $searchPanel.classList.add('open');
            }
        }


        closeOverlay();
        let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
        let isFavorite = favorites.some(fav => fav.name === place.place_name);

        const address = place.road_address_name || place.address_name || "주소 정보 없음";
        const phone = place.phone || "전화번호 정보 없음";
        const position = new kakao.maps.LatLng(place.y, place.x);

        const overlayContent = document.createElement("div");
        overlayContent.className = "bakeryInfoWindowCustom";
        overlayContent.innerHTML = `
            <div class="bakeryTitle">
                <a href="${place.place_url}" target="_blank" title="${place.place_name}">${place.place_name}</a>
                <button class="favorite-btn ${isFavorite ? "active" : ""}">❤</button>
            </div>
            <div class="bakeryText">
                <img src="../../assets/icon/location.png" alt="주소" class="info-icon" />
                ${address}
            </div>
            <div class="bakeryText">
                <img src="../../assets/icon/tel.png" alt="전화번호" class="info-icon" />
                ${phone}
            </div>
            <div class="action-buttons">
                <button class="review-write-map-btn">리뷰 작성</button> 
            </div>
        `;

        ["mousedown", "touchstart"].forEach(evt =>
            overlayContent.addEventListener(evt, e => e.stopPropagation())
        );

        const overlay = new kakao.maps.CustomOverlay({
            position,
            content: overlayContent,
            yAnchor: 1.6,
            xAnchor: 0.5,
            zIndex: 10
        });

        map.panTo(position);
        overlay.setMap(map);
        markerInfo.overlay = overlay;
        // ===== 오버레이에서도 리뷰작성 가능하게 함수호출 =====
        const reviewWriteMapBtn = overlayContent.querySelector(".review-write-map-btn");
        reviewWriteMapBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            // ReviewWriteClick 함수를 place.id를 인자로 호출합니다.
            if (typeof ReviewWriteClick === 'function') {
                ReviewWriteClick(place.id);
            } else {
                console.error("ReviewWriteClick 함수가 정의되지 않았습니다.");
            }
        });
        // [10-29:수정] 마커 클릭 시 기존 검색결과 유지 + 클릭한 업체만 누적 추가 (중복 방지 포함)
        // 클릭한 업체를 localStorage(bakeryResults)에 누적 저장
        if (window.renderSearchResults) {
            const $searchResultsList = document.getElementById('search-results-list');
            const existingIds = Array.from($searchResultsList?.querySelectorAll('.accordion-item') || [])
                .map(item => item.dataset.placeId);

            if (!existingIds.includes(place.id)) {
                window.renderSearchResults([place], true); // append = true → 누적 모드
            }

            const $searchPanel = document.getElementById('search-panel');
            if ($searchPanel) $searchPanel.classList.add('open');
        }

        // [10-29:추가] 마커 클릭 시 로컬스토리지에 해당 업체 정보 누적 저장
        let storedResults = JSON.parse(localStorage.getItem("bakeryResults") || "[]");
        const exists = storedResults.some(item => item.id === place.id);
        if (!exists) {
            storedResults.push(place);
            localStorage.setItem("bakeryResults", JSON.stringify(storedResults));
        }

        // ===== 즐겨찾기 버튼 클릭 =====
        // 맞춤법 맞추는 함수 구현하기!
        const favoriteBtn = overlayContent.querySelector(".favorite-btn");
        favoriteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
            const idx = favorites.findIndex(f => f.name === place.place_name);
            const getJosa = (word) => {
                if (!word) return '가';
                const lastChar = word.charCodeAt(word.length - 1);
                if (lastChar < 0xAC00 || lastChar > 0xD7A3) {
                    return '가';
                }
                const hasJongseong = (lastChar - 0xAC00) % 28;
                return hasJongseong ? '이' : '가';
            };
            const josa = getJosa(place.place_name);
            if (idx === -1) {
                const newItem = {
                    id: Date.now(),
                    name: place.place_name,
                    date: new Date().toLocaleString(),
                    priority: 2,
                    phone: place.phone || '',
                    address: address
                };
                favorites.push(newItem);
                favoriteBtn.classList.add("active");
                dialogHandler.showMOdalSimpleOk('따끈따끈 베이커리 🥨', `${place.place_name}${josa} 즐겨찾기에 추가되었습니다.`);
            } else {
                favorites.splice(idx, 1);
                favoriteBtn.classList.remove("active");
                dialogHandler.showMOdalSimpleOk('따끈따끈 베이커리 🥨', `${place.place_name}${josa} 즐겨찾기에서 삭제되었습니다.`);
            }

            localStorage.setItem("favorites", JSON.stringify(favorites));
            if (window.renderFavorites) window.renderFavorites(favorites);
        });
    }

    // ===== 검색 기록 관리 =====
    const $searchInput = document.getElementById('searchInput');
    const $searchBtn = document.getElementById('searchBtn');
    const $searchHistory = document.getElementById('searchHistory');

    $searchInput.addEventListener('click', e => {
        $searchHistory.style.display = 'revert';
    })
    // [10-29:수정] 검색어 삭제 및 자동검색 처리 개선
    if ($searchHistory) {
        $searchHistory.addEventListener("mousedown", function (e) {
            e.preventDefault();
        });

        $searchHistory.addEventListener("click", function (e) {
            const target = e.target;
            if (target.tagName === "SPAN") {
                const keyword = target.textContent.trim();
                if (!keyword) return;
                $searchInput.value = keyword;
                $searchBtn.click();
            }
        });
    }

    // ===== 검색 버튼 클릭 =====
    $searchBtn.addEventListener('click', function () {
        let keyword = $searchInput.value.trim();
        if (!keyword) {
            dialogHandler.showMOdalSimpleOk('Keyword Error', '키워드를 입력해주세요!');
            return;
        }
        if (userPosition) {
            searchByKeyword(keyword, userPosition, 5000);
        } else {
            searchByKeyword(keyword, map.getCenter(), 5000);
        }
    });

    // ===== 엔터키 검색 =====
    $searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') $searchBtn.click();
    });

    // ===== 지도 클릭 시 오버레이 닫기 =====
    kakao.maps.event.addListener(map, 'click', function () {
        closeOverlay()
        if ($searchHistory) {
            $searchHistory.style.display = 'none';
            $searchInput.blur();
        }
    });

     window.displayPlaceInfo = displayPlaceInfo;
}
