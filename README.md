# 아무무 랜드 (Amumu Land)

리그 오브 레전드 내전 관리 웹사이트

## 🚀 시작하기

### 필수 요구사항

- Node.js (v14 이상)
- PostgreSQL (v12 이상)
- npm 또는 yarn

### 1. Dependencies 설치

```bash
# 서버 및 클라이언트 dependencies 한번에 설치
npm run install-all

# 또는 각각 설치
npm install
cd client && npm install
```

### 2. PostgreSQL 데이터베이스 설정

#### PostgreSQL 설치 및 실행

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS (Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
- PostgreSQL 공식 웹사이트에서 설치 프로그램 다운로드

#### 데이터베이스 생성

```bash
# PostgreSQL 접속
sudo -u postgres psql

# 데이터베이스 및 사용자 생성
CREATE DATABASE amumu_land;
CREATE USER postgres WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE amumu_land TO postgres;
\q
```

#### 스키마 적용

```bash
psql -U postgres -d amumu_land -f database_schema.sql
```

### 3. 환경 변수 설정

`.env` 파일이 자동으로 생성되었습니다. 필요시 수정:

```bash
# .env 파일 편집
nano .env
```

**필수 설정:**
- `DB_PASSWORD`: PostgreSQL 비밀번호
- `PORT`: 서버 포트 (기본값: 3000)

**선택 설정:**
- `DISCORD_BOT_TOKEN`: Discord 봇 기능 사용시
- `DISCORD_CHANNEL_ID`: Discord 알림 채널
- `RIOT_API_KEY`: Riot API 연동시

### 4. 서버 실행

#### 개발 모드 (자동 재시작)
```bash
npm run dev
```

#### 프로덕션 모드
```bash
npm start
```

#### 클라이언트 개발 서버 (별도 터미널)
```bash
cd client
npm start
```

### 5. 빌드

```bash
# 클라이언트 빌드
npm run build

# 프로덕션 실행
NODE_ENV=production npm start
```

## 📁 프로젝트 구조

```
.
├── server.js              # Express 서버
├── discord-bot.js         # Discord 봇 로직
├── database_schema.sql    # DB 스키마
├── client/                # React 클라이언트
│   ├── src/
│   └── public/
├── .env                   # 환경 변수
└── package.json
```

## 🔧 문제 해결

### 데이터베이스 연결 오류
```
❌ 데이터베이스 연결 실패: ECONNREFUSED 127.0.0.1:5432
```

**해결:**
1. PostgreSQL이 실행 중인지 확인: `sudo systemctl status postgresql`
2. 포트 확인: `sudo netstat -plnt | grep 5432`
3. `.env` 파일의 DB 설정 확인

### Discord 봇 경고
```
⚠️ Discord 봇 토큰이 설정되지 않았습니다.
```

**해결:**
- Discord 기능을 사용하지 않으면 무시해도 됩니다
- 사용하려면 `.env`에 `DISCORD_BOT_TOKEN` 설정

## 📝 API 엔드포인트

- `http://localhost:3000` - 서버 주소
- `http://localhost:3001` - 클라이언트 개발 서버 (npm start 시)

## 🤝 기여

이슈나 풀 리퀘스트를 환영합니다!

## 📄 라이센스

MIT License
