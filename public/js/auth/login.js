document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const inputId = form.querySelector('input[type="text"]');
    const inputPw = form.querySelector('input[type="password"]');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = inputId.value.trim();
        const password = inputPw.value.trim();

        const loginData = { email, password };

        try {
            const response = await fetch('http://3.35.212.49:8080/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData)
            });

            if (!response.ok) {
                const error = await response.text();
                alert(`로그인 실패: ${error}`);
                return;
            }

            const user = await response.json();

            localStorage.setItem('userId', user.id);
            localStorage.setItem('userEmail', user.email);
            localStorage.setItem('userNickname', user.nickname);
            // localStorage.setItem('userPassword', user.password); 

            alert(`로그인 성공! ${user.nickname}님 환영합니다.`);
            window.location.href = `../../pages/main/state.html?id=${user.id}`;

        } catch (error) {
            console.error('로그인 중 오류 발생:', error);
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
