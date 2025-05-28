const videoElement = document.getElementById("video");

// 🎥 웹캠 연결 함수
async function startWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
        });
        videoElement.srcObject = stream;
    } catch (err) {
        console.error("웹캠 연결 실패:", err);
        alert("⚠️ 웹캠 접근 권한이 필요합니다.");
    }
}

// 웹캠 시작
startWebcam();

const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

// 캔버스 크기를 비디오와 맞추기
videoElement.addEventListener("loadedmetadata", () => {
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
});

// 백엔드에 이미지 전송 함수
function sendFrameToBackend() {
    if (!videoElement.srcObject) return;

    // 현재 프레임을 캔버스에 그리기
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // 캔버스에서 이미지 blob 추출 (jpeg로 용량 줄임)
    canvas.toBlob((blob) => {
        const formData = new FormData();
        formData.append("image", blob, "frame.jpg");

        fetch("http://localhost:5000/upload-frame", {
            method: "POST",
            body: formData,
        })
            .then((res) => res.json())
            .then((data) => {
                console.log("✅ AI 응답:", data);
                // 👉 data 값에 따라 위험도 UI 갱신 가능
            })
            .catch((err) => {
                console.error("❌ 전송 오류:", err);
            });
    }, "image/jpeg", 0.8); // 품질 80%
}

// 🔁 일정 주기로 프레임 추출 및 전송
setInterval(sendFrameToBackend, 1000); // 1초마다 전송
function captureFrameAndLog() {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL("image/jpeg");

    console.log("🖼️ 캡처된 프레임:", dataURL.slice(0, 100) + "..."); // 너무 길어서 앞부분만 출력
}
setInterval(captureFrameAndLog, 1000);  // 1초마다 확인
