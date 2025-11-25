# 1단계: C++ 컴파일 환경 (기존 내용)
FROM ubuntu:22.04

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# C++ Tools and Locales 설치
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    python3 \
    locales \
    # Node.js 설치 추가 (Render 배포 환경은 Node.js가 필요합니다)
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Set locale
RUN locale-gen en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

# 작업 디렉토리 설정
WORKDIR /app

# 2단계: 프로젝트 파일 복사 및 Node.js 의존성 설치 (추가된 핵심 내용)

# package.json 파일 복사 및 의존성 설치 (캐싱 효율화)
COPY package.json package-lock.json ./

# Node.js 의존성 설치
RUN npm install

# 나머지 프로젝트 파일 모두 복사 (server.js, compiler.js 등)
COPY . .

# 3단계: 애플리케이션 시작 명령 (수정된 핵심 내용)

# Node.js 서버를 실행 명령으로 설정
# Render는 내부적으로 PORT 환경변수를 사용합니다.
CMD ["node", "server.js"]