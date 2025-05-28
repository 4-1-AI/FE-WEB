document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const inputs = form.querySelectorAll('input');
    const nicknameInput = inputs[0];
    const idInput = inputs[1];
    const pwInput = inputs[2];
    const guardianSection = form.querySelector('.guardian-section');
    const addBtn = guardianSection.querySelector('.add-btn');

    // 저장된 회원정보 불러오기
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) {
        alert('회원 정보가 없습니다. 로그인 후 이용해주세요.');
        window.location.href = '../../pages/auth/login.html';
        return;
    }

    // 입력 필드에 저장된 정보 채우기
    nicknameInput.value = storedUser.nickname || '';
    idInput.value = storedUser.id || '';
    pwInput.value = storedUser.password || '';

    // 기존 보호자 정보 표시
    function renderGuardians(guardians) {
        const existingPairs = guardianSection.querySelectorAll('.guardian-pair');
        existingPairs.forEach(pair => guardianSection.removeChild(pair));

        guardians.forEach(({ name, phone }) => {
            const pairDiv = document.createElement('div');
            pairDiv.className = 'guardian-pair';
            pairDiv.innerHTML = `
          <input type="text" required value="${name}" />
          <input type="text" required value="${phone}" />
        `;
            guardianSection.insertBefore(pairDiv, addBtn);
        });
    }

    renderGuardians(storedUser.guardians || []);

    // 보호자 입력 추가
    addBtn.addEventListener('click', () => {
        const newPair = document.createElement('div');
        newPair.className = 'guardian-pair';
        newPair.innerHTML = `
        <input type="text" required />
        <input type="text" required />
      `;
        guardianSection.insertBefore(newPair, addBtn);
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // 닉네임 필수 확인
        if (!nicknameInput.value.trim()) {
            alert('닉네임은 필수 입력사항입니다.');
            return;
        }

        // 보호자 정보 최소 1쌍 필수 확인
        const guardianPairs = guardianSection.querySelectorAll('.guardian-pair');
        if (guardianPairs.length === 0) {
            alert('보호자 정보를 최소 1명 입력해주세요.');
            return;
        }

        // 전화번호 정규식 (- 포함/미포함)
        const phoneRegex = /^01([016789]?)(-?\d{3,4})(-?\d{4})$/;

        let validGuardian = false;
        const guardians = [];
        for (const pair of guardianPairs) {
            const nameInput = pair.querySelector('input[type="text"]:nth-child(1)');
            const phoneInput = pair.querySelector('input[type="text"]:nth-child(2)');
            if (!nameInput || !phoneInput) continue;

            const nameVal = nameInput.value.trim();
            const phoneVal = phoneInput.value.trim();

            // 둘 다 빈칸이면 무시
            if (!nameVal && !phoneVal) continue;

            // 한쪽만 빈칸이면 오류
            if (!nameVal || !phoneVal) {
                alert('보호자 이름과 전화번호를 모두 입력해주세요.');
                return;
            }

            if (!phoneRegex.test(phoneVal)) {
                alert(`전화번호 형식이 올바르지 않습니다: ${phoneVal}`);
                return;
            }

            guardians.push({ name: nameVal, phone: phoneVal });
            validGuardian = true;
        }

        if (!validGuardian) {
            alert('보호자 이름과 전화번호를 모두 입력해주세요.');
            return;
        }

        const updatedUserData = {
            nickname: nicknameInput.value.trim(),
            id: storedUser.id,
            password: storedUser.password,
            guardians: guardians,
        };

        localStorage.setItem('user', JSON.stringify(updatedUserData));
        alert('회원정보가 수정되었습니다.');
    });

    // 뒤로 가기 버튼
    const backBtn = document.querySelector('.back-btn');
    backBtn.addEventListener('click', () => {
        history.back();
    });
});
