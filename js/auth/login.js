document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const inputId = form.querySelector('input[type="text"]');
    const inputPw = form.querySelector('input[type="password"]');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const id = inputId.value.trim();
        const pw = inputPw.value.trim();

        if (!id || !pw) {
            alert('아이디와 비밀번호를 모두 입력해주세요.');
            return;
        }

        const storedUser = JSON.parse(localStorage.getItem('user'));

        if (!storedUser) {
            alert('등록된 회원 정보가 없습니다. 회원 가입 후 로그인 해주세요.');
            return;
        }

        if (id === storedUser.id && pw === storedUser.password) {
            alert(`${id}님, 반갑습니다.`);
            localStorage.setItem('loggedInUser', id);
            window.location.href = '../../pages/main/safe.html';
        } else {
            alert('아이디 또는 비밀번호가 올바르지 않습니다.');
        }
    });

    // 뒤로 가기 버튼
    const backBtn = document.querySelector('.back-btn');
    backBtn.addEventListener('click', () => {
        history.back();
    });
});
  