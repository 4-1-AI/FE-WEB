document.addEventListener("DOMContentLoaded", () => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
        alert("잘못된 접근입니다. 사용자 ID가 없습니다.");
        location.href = "/pages/auth/login.html";
        return;
    }

    const form = document.querySelector("form");
    const nicknameInput = form.querySelector('input[placeholder="닉네임"]');
    const emailInput = form.querySelector('input[placeholder="이메일"]');
    const passwordInput = form.querySelector('input[placeholder="비밀번호"]');
    const guardianSection = document.querySelector(".guardian-section");
    const addBtn = guardianSection.querySelector(".add-btn");
    const logoutBtn = document.querySelector(".logout-btn");
    const deleteBtn = document.querySelector(".delete-btn");
    const backBtn = document.querySelector(".back-btn");

    async function loadUserProfile() {
        try {
            const response = await fetch(`http://localhost:8080/users/${userId}`);
            if (!response.ok) throw new Error("회원 정보를 불러오지 못했습니다.");
            const user = await response.json();

            nicknameInput.value = user.nickname || "";
            emailInput.value = user.email || "";
            passwordInput.value = user.password || "";

            localStorage.setItem("userEmail", user.email);
            localStorage.setItem("userNickname", user.nickname);
            localStorage.setItem("userPassword", user.password);
            localStorage.setItem("userGuardians", JSON.stringify(user.guardians || []));

            guardianSection.querySelectorAll(".guardian-pair").forEach((el, idx) => {
                if (idx > 0) el.remove();
            });

            const guardians = user.guardians || [];
            if (guardians.length > 0) {
                const first = guardianSection.querySelector(".guardian-pair");
                first.querySelector("input:nth-child(1)").value = guardians[0].name || "";
                first.querySelector("input:nth-child(2)").value = guardians[0].phoneNumber || "";

                for (let i = 1; i < guardians.length; i++) {
                    const g = guardians[i];
                    const newPair = document.createElement("div");
                    newPair.className = "guardian-pair";
                    newPair.innerHTML = `
                        <input type="text" value="${g.name}" />
                        <input type="text" value="${g.phoneNumber}" />
                    `;
                    guardianSection.insertBefore(newPair, addBtn);
                }
            }
        } catch (err) {
            console.error("사용자 정보 불러오기 실패", err);
            alert("회원 정보를 불러올 수 없습니다.");
            location.href = "/pages/auth/login.html";
        }
    }
    addBtn.addEventListener("click", () => {
        const newPair = document.createElement("div");
        newPair.className = "guardian-pair";
        newPair.innerHTML = `
            <input type="text" />
            <input type="text" />
        `;
        guardianSection.insertBefore(newPair, addBtn);
    });

    // 회원정보 수정
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const updatedNickname = nicknameInput.value.trim();
        const guardians = [];
        const pairs = guardianSection.querySelectorAll(".guardian-pair");

        pairs.forEach((pair) => {
            const name = pair.querySelector("input:nth-child(1)").value.trim();
            const phone = pair.querySelector("input:nth-child(2)").value.trim();
            if (name && phone) {
                guardians.push({ name, phoneNumber: phone });
            }
        });

        try {
            const response = await fetch(`http://localhost:8080/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nickname: updatedNickname, guardians })
            });

            if (!response.ok) throw new Error("회원 정보 수정 실패");

            // 수정 후 다시 정보 불러오기
            const updatedRes = await fetch(`http://localhost:8080/users/${userId}`);
            if (!updatedRes.ok) throw new Error("수정된 사용자 정보 가져오기 실패");

            const updatedUser = await updatedRes.json();
            localStorage.setItem("userEmail", updatedUser.email);
            localStorage.setItem("userNickname", updatedUser.nickname);
            localStorage.setItem("userPassword", updatedUser.password);
            localStorage.setItem("userGuardians", JSON.stringify(updatedUser.guardians || []));

            alert("회원 정보가 성공적으로 수정되고 저장되었습니다.");
            window.location.reload();

        } catch (err) {
            console.error("회원정보 수정 오류", err);
            alert("수정 중 오류가 발생했습니다.");
        }
    });

    backBtn.addEventListener("click", () => history.back());

    loadUserProfile();
});
