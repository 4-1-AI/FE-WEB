// 개선된 WebSocket 영상 전송 및 렌더링 코드
const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

const alertBar = document.getElementById("alert-bar");
const timeLabel = document.getElementById("time-label");
const safeView = document.getElementById("safe-view");
const cautionView = document.getElementById("caution-view");
const dangerView = document.getElementById("danger-view");

let lastMessageTime = Date.now();
let canSend = true;

function updateTime() {
  const now = new Date();
  timeLabel.textContent = now.toLocaleString();
}
setInterval(updateTime, 1000);

let currentStatus = "safe";
let lastStatusChangeTime = Date.now();

function updateBufferedStatus(newStatus) {
  const now = Date.now(); // 현재 시각(ms). 상태 변경 조건 확인용 타이머 기준

  // 💡 현재 상태와 동일하면 불필요한 업데이트 방지
  if (newStatus === currentStatus) return;

  // ⚠️ caution 상태에서 safe로 내려가는 건 5초 이상 유지 시에만 허용
  if (
    currentStatus === "caution" && newStatus === "safe" &&
    now - lastStatusChangeTime < 5000
  ) {
    return; // 아직 5초 안 지났다면 safe로 전환하지 않음
  }

  // ⚠️ danger 상태에서 내려갈 땐 더 엄격하게 8초 이상 유지 조건 필요
  if (
    currentStatus === "danger" && newStatus !== "danger" &&
    now - lastStatusChangeTime < 8000
  ) {
    return; // danger 상태는 최소 8초 유지되어야 하강 가능
  }

  // ⛔ YOLO 감지 전에 프레임마다 기본으로 오는 safe 전환 무시
  // 예: "safe → safe"인데 전환 시점이 너무 빠르면 무시 (기본 safe 무시)
  if (
    currentStatus === "safe" && newStatus === "safe" &&
    now - lastStatusChangeTime < 2000
  ) {
    return; // 계속 safe일 경우, 너무 자주 UI 갱신되지 않도록 최소 2초 조건
  }

  // ✅ 위 조건을 모두 통과하면 상태 전환 허용
  currentStatus = newStatus; // 현재 상태 갱신
  lastStatusChangeTime = now; // 상태 변경 시간 갱신
  updateView(currentStatus); // 실제 UI 반영 함수 호출
}


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


function checkTimeout() {
  if (Date.now() - lastMessageTime > 5000) {
    updateView("safe");
  }
  setTimeout(checkTimeout, 1000);
}
checkTimeout();

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
          if (!canSend || ws.readyState !== WebSocket.OPEN) return;
          canSend = false;

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            blob.arrayBuffer().then((buffer) => {
              ws.send(buffer);
              canSend = true;
            });
          }, "image/jpeg", 0.7); // 전송 품질 조정
        }, 500); // 전송 주기 증가
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

    if (data.type === "image" && data.image) {
      const img = new Image();
      img.src = "data:image/jpeg;base64," + data.image;
      img.onload = () => {
        requestAnimationFrame(() => {
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
        });
      };
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
