const express = require('express');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const PORT = 80;

// ✅ 1. 정적 파일 서빙 (public 디렉토리 기준)
app.use(express.static(path.join(__dirname, 'public')));

// ✅ 2. HTTP 서버로부터 WebSocket 서버 생성
const server = app.listen(PORT, () => {
  console.log(`🌐 정적 서버 실행 중: http://localhost:${PORT}`);
});

const wss = new WebSocket.Server({
  server, // ← Express 서버 기반으로 WebSocket 실행
  path: '/ws-stream',
});

wss.on('connection', (ws) => {
  console.log('✅ 클라이언트 연결됨');
  ws.on('message', (message) => {
    console.log('📥 메시지 수신:', message);
    ws.send("📢 서버 응답: " + message);
  });
  ws.on('close', () => console.log('🔌 연결 종료'));
});
