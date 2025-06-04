// server.js
const WebSocket = require('ws');

const wss = new WebSocket.Server({
  port: 8080,
  path: '/ws-stream',
});

wss.on('connection', (ws) => {
  console.log('✅ 클라이언트 연결됨');

  ws.on('message', (message) => {
    console.log('📥 메시지 수신:', message);
    ws.send("📢 서버 응답: " + message);
  });

  ws.on('close', () => {
    console.log('🔌 연결 종료');
  });
});

console.log('🚀 WebSocket 서버 실행 중: ws://localhost:8080/ws-stream');
