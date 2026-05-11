# Couple Asset Dashboard

인웅과 운정의 월별 자산 공유를 깔끔하게 기록하기 위한 React 대시보드입니다.

## 주요 기능

- 인웅 / 운정 자산을 항목별로 입력
- CMA, ISA, 주택청약, 청년도약계좌, 해외주식, 연금저축펀드, 전세금, 코인, 현금자산 기본 항목 제공
- 원하는 자산 항목 직접 추가
- 현재 합산 자산, 개인별 합산, 전월 대비 증가액 자동 계산
- 월별 기록 목록과 항목별 비중 차트
- Supabase 연결 전에는 브라우저 localStorage에 임시 저장
- Supabase 연결 후 `asset_snapshots` 테이블에 월별 스냅샷 저장

## 실행

```bash
nvm use 22.17.0
npm install
npm run dev -- --port 5173
```

브라우저에서 `http://127.0.0.1:5173/index.html`을 열면 됩니다.

## Supabase 연결

1. Supabase 프로젝트를 만들고 SQL Editor에서 `supabase.sql` 내용을 실행합니다.
2. `.env.example`을 참고해서 `.env` 파일을 만듭니다.
3. 아래 값을 채웁니다.

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. 개발 서버를 재시작합니다.

현재 SQL은 빠르게 혼자 쓰기 위한 anon 접근 정책입니다. 실제 배포나 민감한 자산 데이터 저장 전에는 Supabase Auth를 붙이고 사용자별 Row Level Security로 잠그는 구성이 좋습니다.

## GitHub Pages 배포

`.github/workflows/deploy.yml`이 포함되어 있습니다. GitHub 레포에 `main` 브랜치로 푸시하면 자동으로 빌드하고 GitHub Pages에 배포합니다.

GitHub 레포 Settings에서 Pages Source가 `GitHub Actions`로 설정되어 있어야 합니다. 이 프로젝트는 `.env.production`에 Supabase 공개 클라이언트 값을 포함해 배포 시 바로 연결됩니다.
