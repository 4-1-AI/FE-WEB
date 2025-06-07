# 1. Node.js 베이스 이미지
FROM node:18-slim

# 2. 작업 디렉토리 생성
WORKDIR /app

# 3. package*.json 복사 및 의존성 설치
COPY package*.json ./
RUN npm install

# 4. 전체 소스 복사
COPY . .

# 5. Express 서버 실행 (포트 3000 기준)
EXPOSE 80
CMD ["node", "server.js"]
