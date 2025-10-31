/* 시작 */
window.addEventListener('DOMContentLoaded', () => {
    // console.log('favorite.js 실행');

    document.body.addEventListener("click", (event) => {
        const target = event.target;
        if (!target.classList.contains("favorite-btn")) return;

        const infoBoxes = document.querySelectorAll(".bakeryInfoWindowCustom");
        let infoBox = null;

        for (let i = 0; i < infoBoxes.length; i++) {
            if (infoBoxes[i].contains(target)) {
                infoBox = infoBoxes[i];
                break;
            }
        }

        if (!infoBox) return;

        const title = infoBox.querySelector(".bakeryTitle");
        const text = infoBox.querySelector(".bakeryText");

        const name = title ? title.textContent.trim() : '이름없음';
        const address = text ? text.textContent.trim() : '주소없음';

        // 로컬 스토리지 불러오기
        let favorites = window.storage.get("favorites", []);
        let found = false;

        // 중복건 조회 및 삭제
        for (let i = 0; i < favorites.length; i++) {
            if (favorites[i].name === name) {
                favorites.splice(i, 1);
                found = true;
                window.storage.set("favorites", favorites);
                window.renderFavorites(favorites);
                target.classList.remove("active");
                dialogHandler.showMOdalSimpleOk('따끈따끈 베이커리 🥨',`${name} 즐겨찾기 목록에서 삭제되었습니다.`);
                return;
            }
        }

        const newItem = {
            id: Date.now(),
            name: place?.place_name || name || '이름없음',  // API 데이터 or DOM 데이터
            date: new Date().toLocaleString(),
            priority: 2,
            phone: place?.phone || '',                     // API 데이터면 phone 채움
            address: place?.road_address_name || place?.address_name || address || '주소없음',
        };

        favorites.push(newItem);
        window.storage.set("favorites", favorites);
        window.renderFavorites(favorites);
        target.classList.add("active");
        dialogHandler.showMOdalSimpleOk('따끈따끈 베이커리 🥨',`${name} 즐겨찾기 목록에 추가되었습니다.`);
    });
});
