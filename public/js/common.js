// 살시간 시간
function updateTime() {
    const timeElement = document.querySelector('.time');
    if (!timeElement) return;

    const now = new Date();

    const month = now.getMonth() + 1;
    const date = now.getDate();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    timeElement.textContent = `${month}/${date} ${hours}:${minutes}`;
}

document.addEventListener('DOMContentLoaded', () => {
    const linkElement = document.querySelector('a.link');
    const loggedInUser = localStorage.getItem('userId'); 

    if (linkElement) {
        if (loggedInUser) {
            linkElement.textContent = '회원정보 수정';
            linkElement.href = '../../pages/auth/user-edit.html';
        } else {
            linkElement.textContent = '로그인';
            linkElement.href = '../../pages/auth/login.html';
        }
    }
});


setInterval(updateTime, 60000);

updateTime();
