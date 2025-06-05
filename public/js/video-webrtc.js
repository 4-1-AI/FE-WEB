const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

// WebSocket 연결
const ws = new WebSocket("ws://localhost:8000/ws/stream");

ws.onopen = () => {
  console.log("✅ WebSocket 연결 완료");

  // 웹캠 스트림 시작
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then((stream) => {
      video.srcObject = stream;

      video.addEventListener("loadedmetadata", () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // 1초마다 프레임 캡처 후 전송
        setInterval(() => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            blob.arrayBuffer().then((buffer) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(buffer); // 바이너리 데이터 전송
              }
            });
          }, "image/jpeg", 0.9);
        }, 500); // 1초 간격
      });
    })
    .catch((err) => {
      console.error("🚫 웹캠 접근 실패:", err);
    });
};

// 메시지 수신 시 bbox, 상태 등 시각화
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  // base64 이미지 렌더링
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

    // 상태 텍스트 표시
    ctx.font = "20px Arial";
    ctx.fillStyle = "yellow";
    ctx.fillText(`🔥 상태: ${data.statusLabel}`, 10, 30);
  };
};

ws.onerror = (e) => {
  console.error("❌ WebSocket 오류:", e);
};

ws.onclose = () => {
  console.log("🔌 WebSocket 연결 종료");
};
