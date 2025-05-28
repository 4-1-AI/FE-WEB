const videoElement = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

let hasConnectionError = false; // 백엔드 연결 실패 플래그
let isSending = false; // 중복 전송 방지 플래그

// 웹캠 연결 함수
async function startWebcam() {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
    });
    videoElement.srcObject = stream;
}

// 비디오 메타데이터 로드 시 캔버스 크기 한 번만 설정
videoElement.addEventListener("loadedmetadata", () => {
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
});

// 백엔드에 이미지 전송 함수
function sendFrameToBackend() {
    if (hasConnectionError) return; // 연결 실패하면 전송 중단
    if (isSending) return; // 중복 전송 방지
    if (!videoElement.srcObject) return;

    isSending = true;

    // 현재 비디오 프레임을 캔버스에 그림
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // 이미지 blob 추출 및 전송
    canvas.toBlob((blob) => {
        const formData = new FormData();
        formData.append("image", blob, "frame.jpg");

        fetch("http://localhost:5002/upload-frame", {
            method: "POST",
            body: formData,
        })
            .then((res) => {
                if (!res.ok) throw new Error("서버 응답 실패");
                return res.json();
            })
            .then((data) => {
                console.log("✅ AI 응답:", data);
            })
            .catch((err) => {
                console.error("❌ 전송 오류:", err);
                hasConnectionError = true;  // 전송 오류 발생 시 전송 중단
            })
            .finally(() => {
                isSending = false;
            });
    }, "image/jpg", 0.8);
}

// 캡처된 프레임 데이터 URL 콘솔 출력 함수
function captureFrameAndLog() {
    if (!videoElement.srcObject) return;
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL("image/jpeg");
    console.log("🖼️ 캡처된 프레임:", dataURL.slice(0, 100) + "...");
}

// 0.1초마다 백엔드에 프레임 전송
setInterval(sendFrameToBackend, 100);

// 0.1초마다 캡처된 프레임 로그 출력
setInterval(captureFrameAndLog, 100);

startWebcam();
