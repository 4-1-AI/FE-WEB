const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

let lastMessageTime = Date.now();
const alertBar = document.getElementById("alert-bar");
const timeLabel = document.getElementById("time-label");

const safeView = document.getElementById("safe-view");
const cautionView = document.getElementById("caution-view");
const dangerView = document.getElementById("danger-view");

function updateTime() {
  const now = new Date();
  timeLabel.textContent = now.toLocaleString();
}
setInterval(updateTime, 1000);

// 상태별 뷰 전환
function updateView(status) {
  safeView.classList.add("hidden");
  cautionView.classList.add("hidden");
  dangerView.classList.add("hidden");
  alertBar.className = "alert-bar";

  switch (status) {
    case "safe":
      safeView.classList.remove("hidden");
      alertBar.textContent = "안전";
      alertBar.classList.add("safe");
      break;
    case "caution":
      cautionView.classList.remove("hidden");
      alertBar.textContent = "이상 감지";
      alertBar.classList.add("caution");
      break;
    case "danger":
      dangerView.classList.remove("hidden");
      alertBar.textContent = "위험 단계";
      alertBar.classList.add("danger");
      break;
    default:
      alertBar.textContent = "대기 중";
  }
}

// 일정 시간 메시지 없으면 safe 상태 전환
function checkTimeout() {
  if (Date.now() - lastMessageTime > 5000) {
    updateView("safe");
  }
  setTimeout(checkTimeout, 1000);
}
checkTimeout();

// WebSocket 연결
const ws = new WebSocket("ws://localhost:8000/ws/stream");

ws.onopen = () => {
  console.log("✅ WebSocket 연결됨");

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

ws.onmessage = (event) => {
  lastMessageTime = Date.now();

  try {
    const data = JSON.parse(event.data);
    console.log("📦 WebSocket 수신 데이터:", data);

    if (data.statusLabel) {
      updateView(data.statusLabel);
    }

    // type이 image일 때만 시각화 진행
    if (data.type === "image" && data.image) {
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
    } else if (data.type !== "image") {
      console.log("ℹ️ 이미지 외 메시지 수신:", data.type);
    }
  } catch (e) {
    console.error("❌ WebSocket 메시지 파싱 실패:", e);
    console.error("원본 메시지:", event.data);
  }
};


ws.onclose = () => {
  console.log("🔌 WebSocket 연결 종료");
  updateView("safe");
};
