document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.querySelector('.logout-btn');
    const deleteBtn = document.querySelector('.delete-btn');    

    logoutBtn.addEventListener('click', () => {
        const confirmDelete = confirm('정말 로그아웃을 진행하시겠습니까?');
        if (!confirmDelete) return;
        localStorage.removeItem('loggedInUser');
        alert('로그아웃 되었습니다.');
        window.location.href = '../../pages/auth/login.html';
    });

    deleteBtn.addEventListener('click', () => {
        const confirmDelete = confirm('정말 회원 탈퇴를 진행하시겠습니까?');
        if (!confirmDelete) return;

        localStorage.removeItem('user');
        localStorage.removeItem('loggedInUser');

        alert('회원 탈퇴가 완료되었습니다.');
        window.location.href = '../../pages/auth/signup.html';
    });
});
  