const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

let lastMessageTime = Date.now();

// ❶ 메시지 수신이 일정 시간 없으면 safe.html로 리다이렉트
function checkTimeout() {
  const now = Date.now();
  const diff = now - lastMessageTime;
  const currentPath = window.location.pathname;

  if (diff > 5000 && !currentPath.includes("safe.html")) {
    console.log("⏱️ 일정 시간 메시지 없음 → safe.html 이동");
    window.location.href = "../../pages/main/safe.html";
  } else {
    setTimeout(checkTimeout, 1000); // 재귀 호출로 1초마다 체크
  }
}
setTimeout(checkTimeout, 1000); // 타이머 시작

// ❷ WebSocket 연결
const ws = new WebSocket("ws://localhost:8000/ws/stream");

ws.onopen = () => {
  console.log("✅ WebSocket 연결 완료");

  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then((stream) => {
      video.srcObject = stream;

      video.addEventListener("loadedmetadata", () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        setInterval(() => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            blob.arrayBuffer().then((buffer) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(buffer);
              }
            });
          }, "image/jpeg", 0.9);
        }, 500);
      });
    })
    .catch((err) => {
      console.error("🚫 웹캠 접근 실패:", err);
    });
};

// ❸ 메시지 수신 시 처리
ws.onmessage = (event) => {
  lastMessageTime = Date.now(); // 모든 메시지 수신 시점 갱신

  const data = JSON.parse(event.data);
  const currentPath = window.location.pathname;

  // 상태 메시지 수신 시 페이지 이동
  if (data.type === "status" && data.statusLabel) {
    if (data.statusLabel === "safe" && !currentPath.includes("safe.html")) {
      window.location.href = "../../pages/main/safe.html";
    } else if (data.statusLabel === "caution" && !currentPath.includes("caution.html")) {
      window.location.href = "../../pages/main/caution.html";
    } else if (data.statusLabel === "danger" && !currentPath.includes("danger.html")) {
      window.location.href = "../../pages/main/danger.html";
    }
    return;
  }

  // bbox 포함 이미지 시각화
  const img = new Image();
  img.src = "data:image/jpeg;base64," + data.image;

  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (data.boxes) {
      data.boxes.forEach((box) => {
        ctx.strokeStyle = box.label === '1' ? 'red' : 'blue';
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.w, box.h);
      });
    }

    ctx.font = "20px Arial";
    ctx.fillStyle = "yellow";
    ctx.fillText(`🔥 상태: ${data.statusLabel}`, 10, 30);
  };
};

ws.onerror = (e) => {
  console.error("❌ WebSocket 오류:", e);
};

// ❹ 연결 종료 시 fallback
ws.onclose = () => {
  console.log("🔌 WebSocket 연결 종료");
  const currentPath = window.location.pathname;
  if (!currentPath.includes("safe.html")) {
    window.location.href = "../../pages/main/safe.html";
  }
};
