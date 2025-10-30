window.onload = function() {
    // 기본 위치 설정
    const defaultPosition = new kakao.maps.LatLng(35.866089056897216, 128.59385746985728);

    // 맵 초기화 함수
    function initializeMap(centerPosition, userLocation) {
        let mapContainer = document.querySelector('.map-area'),
            mapOption = {
                center: centerPosition,
                level: 4
            };
        let map = new kakao.maps.Map(mapContainer, mapOption);
        let mapTypeControl = new kakao.maps.MapTypeControl();
        map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT);

        let zoomControl = new kakao.maps.ZoomControl();
        map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);


        if (userLocation) {

            let content = '<div class="user-marker-wrap">' +
                '  <div class="user-marker-dot"></div>' +    // 중심 파란 점
                '  <div class="user-marker-pulse"></div>' +  // 바깥쪽 펄스
                '</div>';

            new kakao.maps.CustomOverlay({
                map: map,
                position: userLocation,
                content: content,
                xAnchor: 0.5,
                yAnchor: 0.5
            });
        }

        initMapSearch(map, userLocation);
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            // 성공 시
            let lat = position.coords.latitude;
            let lon = position.coords.longitude;
            let userPosition = new kakao.maps.LatLng(lat, lon);

            // 사용자의 현재 위치를 중심으로 지도 초기화
            initializeMap(userPosition, userPosition);

        }, function(error) {
            // 실패 또는 거부 시
            console.warn("Geolocation failed: " + error.message);
            alert("위치 정보를 가져오는 데 실패했습니다. 기본 위치를 중심으로 검색합니다.");

            // 기본 위치(대구)를 중심으로 지도 초기화 (userLocation은 null)
            initializeMap(defaultPosition, null);
        });
    } else {
        // Geolocation을 지원하지 않는 브라우저
        alert("이 브라우저에서는 Geolocation을 지원하지 않습니다. 기본 위치를 중심으로 검색합니다.");

        // 기본 위치(대구)를 중심으로 지도 초기화 (userLocation은 null)
        initializeMap(defaultPosition, null);
    }
};