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

// function updateTime() {
//     const now = new Date();
//     timeLabel.textContent = now.toLocaleString();
// }
// setInterval(updateTime, 1000);

let currentStatus = "safe";
let lastStatusChangeTime = Date.now();
let cautionCount = 0; // 커션 상태 연속 감지 카운트
updateView("safe");

//상태 업데이트 & 버퍼링 로직
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

  // 커션 상태가 5번 연속 감지되면 타이머
  if (newStatus === "caution") {
    cautionCount++;
    if (cautionCount >= 5) {
      startVisualSmsTimer();  
    }
  } else {
    cautionCount = 0;
  }
}

//ui 업데이트
function updateView(status) {
  // alert-bar만 초기화 (title-row나 time-label 건드리지 않음)
  document.querySelectorAll(".alert-bar").forEach(el => el.classList.add("hidden"));

  // 버튼 및 상태별 박스 초기화
  document.querySelectorAll(".warn-btn").forEach(el => el.classList.add("hidden"));
  document.querySelector(".info-box.guardian-msg")?.classList.add("hidden");
  document.querySelector(".footer-text.caution")?.classList.add("hidden");

  // 상태별 alert-bar 가져오기
  const safeBar = document.querySelector(".alert-bar.safe");
  const cautionBar = document.querySelector(".alert-bar.caution");
  const dangerBar = document.querySelector(".alert-bar.danger");

  switch (status) {
    case "safe":
      safeBar.classList.remove("hidden");
      document.querySelector(".warn-btn.safe")?.classList.remove("hidden");
      break;

    case "caution":
      cautionBar.classList.remove("hidden");
      document.querySelector(".warn-btn.caution")?.classList.remove("hidden");
      document.querySelector(".footer-text.caution")?.classList.remove("hidden");
      break;

    case "danger":
      dangerBar.classList.remove("hidden");
      document.querySelector(".warn-btn.danger")?.classList.remove("hidden");
      document.querySelector(".info-box.guardian-msg")?.classList.remove("hidden");
      break;

    default:
      safeBar.classList.remove("hidden");
  }
}

//웹 소켓 연결
const ws = new WebSocket("ws://localhost:8000/ws/stream");

ws.onopen = () => {
  console.log("✅ WebSocket 연결됨");

  const userId = localStorage.getItem("userId");
  if (userId) {
    ws.send(userId);  // 서버는 첫 메시지로 userId 수신함
    console.log("📤 userId 전송됨:", userId);
  } else {
    console.warn("❗ userId가 localStorage에 없습니다.");
  }

  //웹캠 스트리밍 시작
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then((stream) => {
      video.srcObject = stream;

      video.addEventListener("loadedmetadata", () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        // 영상 캡처 -> 서버 전송
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
        }, 500); // 전송 주기 증가.
      });
    })
    .catch((err) => {
      console.error("🚫 웹캠 접근 실패:", err);
    });
};

//서버에서 감지 결과 수신 후 처리
ws.onmessage = (event) => {
  lastMessageTime = Date.now();

  try {
    const data = JSON.parse(event.data);
    console.log("📦 WebSocket 수신 데이터:", data);

    // 'caution' 상태 감지 시 카운트 증가
    if (data.statusLabel === "caution") {
      cautionCount++;
      if (cautionCount >= 5) {
        startVisualSmsTimer(); // 커션 상태가 5번 연속되면 타이머 시작
      }
    } else {
      // 커션 상태가 아니면 카운트 리셋
      cautionCount = 0;
    }

    if (data.statusLabel) {
      updateView(data.statusLabel);
    }

    if (data.type === "image" && data.image) {
      const img = new Image();
      img.src = "data:image/jpeg;base64," + data.image;
      img.onload = () => {
        //캔버스에 이미지 + 박스 + 상태 표시
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

//문자 타이머 !!
let smsTimerInterval = null;
let isSmsTimerRunning = false;

// 타이머 시작 함수
function startVisualSmsTimer(seconds = 180) {
  if (cautionCount < 5) return; 

  if (isSmsTimerRunning) return;
  isSmsTimerRunning = true;

  const timerText = document.querySelector(".countdown");
  const responseBox = document.querySelector(".info-box.response-wait");
  const cancelBtn = document.querySelector(".cancel-btn");

  if (!timerText || !responseBox || !cancelBtn) return;

  cancelBtn.classList.remove("hidden");
  cancelBtn.disabled = false;
  cancelBtn.style.opacity = 1;
  cancelBtn.textContent = "✕";

  responseBox.classList.remove("hidden");

  let remaining = seconds;
  timerText.textContent = formatTime(remaining);
  timerText.style.color = "";

  smsTimerInterval = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(smsTimerInterval);
      smsTimerInterval = null;
      timerText.textContent = "⏰ 문자 발송 중...";
      return;
    }
    timerText.textContent = formatTime(remaining);
  }, 1000);
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}분 ${s.toString().padStart(2, "0")}초 남음`;
}

document.querySelector(".cancel-btn")?.addEventListener("click", (e) => {
  const userId = localStorage.getItem("userId");

  //타이머 정지
  if (smsTimerInterval) {
    clearInterval(smsTimerInterval);
    smsTimerInterval = null;
  }

  const timerText = document.querySelector(".countdown");
  if (timerText) {
    timerText.textContent = "⛔ 문자 발송이 취소되었습니다";
    timerText.style.color = "gray";
  }

  const cancelBtn = e.target;
  cancelBtn.disabled = true;
  cancelBtn.style.opacity = 0.5;
  cancelBtn.textContent = "취소됨";
  isSmsTimerRunning = false;

  //문자 취소
  if (userId) {
    fetch("http://3.35.212.49:8080/alert/fire-cause/sms/stop", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId: parseInt(userId) })
    })
      .then(res => res.text())
      .then(msg => {
        console.log("🛑 문자 예약 취소됨:", msg);
      })
      .catch(err => {
        console.error("❌ 문자 취소 실패:", err);
      });
  }
});

ws.onclose = () => {
  console.log("🔌 WebSocket 연결 종료");
  updateView("safe");
};

// 상태 강제 지정 테스트용
window.updateView = updateView;
window.updateBufferedStatus = updateBufferedStatus;
console.log("✅ updateView 등록됨");

