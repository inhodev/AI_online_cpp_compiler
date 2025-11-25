# 1. Base Image
FROM ubuntu:22.04

# 2. 환경 설정
ENV DEBIAN_FRONTEND=noninteractive

# 3. 기본 도구 설치 (curl 추가)
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    python3 \
    locales \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 4. 최신 Node.js (v20) 설치 설정
# Ubuntu 기본 저장소 대신 NodeSource 저장소를 사용하여 최신 버전을 받습니다.
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# 5. 로케일 설정
RUN locale-gen en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

# 6. 작업 디렉토리 설정
WORKDIR /app

# 7. 프로젝트 파일 복사 및 의존성 설치
COPY package.json package-lock.json ./
RUN npm install

# 8. 소스 코드 복사
COPY . .

# 9. 서버 실행
CMD ["node", "server.js"]