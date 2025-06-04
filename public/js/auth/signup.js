document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const inputs = form.querySelectorAll('input');
    const nicknameInput = inputs[0];
    const idInput = inputs[1];
    const pwInput = inputs[2];
    const guardianSection = form.querySelector('.guardian-section');
    const addBtn = guardianSection.querySelector('.add-btn');

    // 보호자 칸 추가하기
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

        // 기본 입력 체크
        if (!nicknameInput.value.trim() || !idInput.value.trim() || !pwInput.value.trim()) {
            alert('닉네임, 아이디, 비밀번호는 필수 입력사항입니다.');
            return;
        }

        // 비밀번호 조건: 8자 이상, 대문자, 소문자, 특수문자 포함
        const pw = pwInput.value.trim();
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/;
        if (!passwordRegex.test(pw)) {
            alert('비밀번호는 8자 이상이며, 대문자, 소문자, 특수문자를 각각 최소 1개 이상 포함해야 합니다.');
            return;
        }

        // 보호자 정보 최소 1쌍 필수 확인
        const guardianPairs = guardianSection.querySelectorAll('.guardian-pair');
        if (guardianPairs.length === 0) {
            alert('보호자 정보를 최소 1명 입력해주세요.');
            return;
        }

        // 전화번호 정규식
        const phoneRegex = /^01([0|1|6|7|8|9]?)-?([0-9]{3,4})-?([0-9]{4})$/;

        // 최소 1쌍, 전화번호 형식 체크
        let validGuardian = false;
        const guardians = [];
        for (const pair of guardianPairs) {
            const nameInput = pair.querySelector('input[type="text"]:nth-child(1)');
            const phoneInput = pair.querySelector('input[type="text"]:nth-child(2)');
            if (!nameInput || !phoneInput) continue;

            const nameVal = nameInput.value.trim();
            const phoneVal = phoneInput.value.trim();

            if (nameVal && phoneVal) {
                if (!phoneRegex.test(phoneVal)) {
                    alert(`전화번호 형식이 올바르지 않습니다: ${phoneVal}`);
                    return;
                }
                guardians.push({ name: nameVal, phone: phoneVal });
                validGuardian = true;
            }
        }
        if (!validGuardian) {
            alert('보호자 이름과 전화번호를 모두 입력해주세요.');
            return;
        }

        // 아이디 중복 체크
        const existingUser = JSON.parse(localStorage.getItem('user'));
        if (existingUser && existingUser.id === idInput.value.trim()) {
            alert('이미 존재하는 아이디입니다. 다른 아이디를 입력해주세요.');
            return;
        }

        // 회원정보 저장
        const userData = {
            nickname: nicknameInput.value.trim(),
            id: idInput.value.trim(),
            password: pw,
            guardians: guardians,
        };
        localStorage.setItem('user', JSON.stringify(userData));

        alert('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
        window.location.href = '../../pages/auth/login.html';
    });

    // 뒤로 가기 버튼
    const backBtn = document.querySelector('.back-btn');
    backBtn.addEventListener('click', () => {
        history.back();
    });
});
