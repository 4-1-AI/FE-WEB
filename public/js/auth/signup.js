document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const inputs = form.querySelectorAll('input');
    const nicknameInput = inputs[0];
    const idInput = inputs[1];
    const pwInput = inputs[2];
    const guardianSection = form.querySelector('.guardian-section');
    const addBtn = guardianSection.querySelector('.add-btn');

    addBtn.addEventListener('click', () => {
        const newPair = document.createElement('div');
        newPair.className = 'guardian-pair';
        newPair.innerHTML = `
            <input type="text" placeholder="보호자 이름" required />
            <input type="text" placeholder="전화번호" required />
        `;
        guardianSection.insertBefore(newPair, addBtn);
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nickname = nicknameInput.value.trim();
        const email = idInput.value.trim();
        const password = pwInput.value.trim();

        const guardians = [];
        const pairs = guardianSection.querySelectorAll('.guardian-pair');
        for (const pair of pairs) {
            const nameInput = pair.querySelector('input:nth-child(1)');
            const phoneInput = pair.querySelector('input:nth-child(2)');
            guardians.push({
                name: nameInput.value.trim(),
                phoneNumber: phoneInput.value.trim()
            });
        }

        const userData = {
            email,
            password,
            nickname,
            guardians
        };

        try {
            const response = await fetch('http://3.35.212.49:8080/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                alert(`회원가입 실패: ${errorText}`);
                return;
            }

            const result = await response.text();
            alert(result);
            window.location.href = '../../pages/auth/login.html';
        } catch (err) {
            console.error('회원가입 중 오류 발생:', err);
            alert('서버 연결에 실패했습니다.');
        }
    });

    // 뒤로 가기 버튼
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            history.back();
        });
    }
});
