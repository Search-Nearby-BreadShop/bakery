// (1) 검색기록 패널 렌더링 함수 추가 — window.onload 바깥에 작성
function renderSearchHistoryPanel() {
    const history = JSON.parse(localStorage.getItem("searchHistory") || "[]");
    const $searchResultsList = document.getElementById('search-results-list');
    if (!$searchResultsList) return;

    if (history.length === 0) {
        $searchResultsList.innerHTML = `
            <li class="accordion-item">
                <button class="accordion-btn" type="button" disabled>최근 검색기록이 없습니다.</button>
            </li>
        `;
        return;
    }

    // 검색기록을 리스트로 렌더링
    $searchResultsList.innerHTML = history.map(keyword => `
        <li class="accordion-item">
            <button class="accordion-btn history-item" type="button">${keyword}</button>
        </li>
    `).join('');

    // 패널 열기
    const $searchPanel = document.getElementById('search-panel');
    if ($searchPanel) {
        $searchPanel.classList.add('open');
        $searchPanel.classList.remove('collapsed');
    }
}

// [10-29:수정]
window.renderSearchHistoryPanel = renderSearchHistoryPanel;
//[추가] 오버레이 전역 상태 관리용 변수 선언
// window.activeOverlay = null;

// [10-29:수정] initializeMap을 전역 함수로 변경 (window.onload 바깥으로 이동)
function initializeMap(centerPosition, userLocation) {
    let mapContainer = document.querySelector('.map-area'),
        mapOption = {
            center: centerPosition,
            level: 4
        };
    let map = new kakao.maps.Map(mapContainer, mapOption);
    window.map = map; // 전역 등록 (지도 객체 보존)

    let mapTypeControl = new kakao.maps.MapTypeControl();
    map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT);

    let zoomControl = new kakao.maps.ZoomControl();
    map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

    // [10-29:개선] 정확한 내 위치 마커 렌더링 — 기존 유지 + 보강
    if (userLocation) {
        const content = `
            <div class="user-marker-wrap">
                <div class="user-marker-dot"></div>
                <div class="user-marker-pulse"></div>
            </div>`;
        new kakao.maps.CustomOverlay({
            map: map,
            position: userLocation,
            content: content,
            xAnchor: 0.5,
            yAnchor: 0.5
        });

        // [10-29:개선] 지도 중심을 사용자의 정확한 위치로 재설정 (지오로케이션 성공 시 확실히 반영)
        map.setCenter(userLocation);
    }

    initMapSearch(map, userLocation);

    // [10-29:추가] 즐겨찾기 → 지도에서 보기 클릭 시 오버레이/마커 정상 표시
    window.focusBakeryOnMap = function (bakery) {
        if (!window.map || typeof kakao === 'undefined' || !bakery) return;
        const placeData = {
            id: bakery.id,
            place_name: bakery.place_name || bakery.name, // name → place_name 매핑
            address_name: bakery.address_name || bakery.address,
            road_address_name: bakery.road_address_name || bakery.address,
            phone: bakery.phone || '',
            x: bakery.x,
            y: bakery.y
        };

        // 즐겨찾기 호출임을 전역 플래그로 표시
        window.fromFavoriteFocus = true;

        // // [추가] 현재 열린 오버레이 저장
        if (typeof window.displayPlaceInfo === 'function') {
            window.displayPlaceInfo(placeData, { markerOverlay });
        }
    };
}


// [10-29:개선] 정확한 내 위치 중심 세팅 — window.onload 내부 개선
window.onload = function() {
    const defaultPosition = new kakao.maps.LatLng(35.866089056897216, 128.59385746985728);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                // 성공 시: 정확한 내 위치를 기반으로 지도 초기화
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const userPosition = new kakao.maps.LatLng(lat, lon);

                console.log("현재 위치 감지 완료:", lat, lon);
                initializeMap(userPosition, userPosition);
            },
            function(error) {
                //실패 또는 거부 시
                console.warn("Geolocation failed: " + error.message);
                alert("위치 정보를 가져오는 데 실패했습니다. 기본 위치(대구)로 설정합니다.");
                initializeMap(defaultPosition, null);
            },
            {
                enableHighAccuracy: true,  // 고정밀 GPS 모드 활성화
                timeout: 10000,            // 10초 이내 실패 처리
                maximumAge: 0              // 캐시된 위치 무시 (항상 최신값)
            }
        );
    } else {
        // Geolocation 미지원 브라우저
        alert("이 브라우저에서는 Geolocation을 지원하지 않습니다. 기본 위치로 설정합니다.");
        initializeMap(defaultPosition, null);
    }
};


// [10-29:수정->전역 등록 (main.js에서 initMap() 호출 가능하게 함)]
window.initMap = function() {
    const defaultPosition = new kakao.maps.LatLng(35.866089056897216, 128.59385746985728);
    initializeMap(defaultPosition, null);
};
console.log('window.initMap 전역 등록 완료');
