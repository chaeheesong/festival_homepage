# festival_homepage

2026 용담용연 음악회·문화제 홈페이지 (React + TypeScript + Vite)

## 실행

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 배포용 빌드 (dist/)
npm run preview  # 빌드 결과 미리보기
```

## 구성

| 경로 | 내용 |
|---|---|
| `src/App.tsx`, `src/App.css` | 메인 페이지 (PC / 모바일 768px 이하) |
| `src/data.ts` | 메인 페이지 내용: 출연진, 참가 프로그램, 시간표, 체험존, 약도, 연락처 |
| `src/ApplicationPage.tsx`, `src/ApplicationPage.css` | 프로그램별 참가신청 화면과 신청 완료 화면 |
| `src/applications.ts` | 참가신청서 내용 (안내, 입력 항목, 필수/선택) |
| `public/asset/image/` | 이미지 (첫 화면 배경, 출연진, 체험존, 약도) |

- 참가신청 화면은 `?p=walk`, `?p=culture`, `?p=song`, `?p=runner`, `?p=stamp`, `?p=market`, `?p=foodtruck` 주소로 열립니다.
- 신청 내용은 아직 서버에 저장되지 않습니다 (신청 완료 화면만 표시).

## 이미지 교체

`public/asset/image/`에 같은 파일명으로 덮어쓰면 됩니다.

| 파일 | 용도 | 권장 |
|---|---|---|
| `hero-bg.png` | PC 첫 화면 배경 | 가로 2560px 이상, 중요한 부분은 가운데 |
| `hero-bg-mobile.png` | 모바일 첫 화면 배경 | 세로형 약 1080 × 1550 |
| `artist-*.png` | 출연진 사진 | 정사각형에 가깝게 (위쪽 기준으로 잘림) |
| `experience-*.png` | 체험존 카드 배경 (PC / `-mobile`) | |
| `map.png` | 약도 | 2 : 1, 교체 시 `src/data.ts`의 `MAP` 크기·마커 위치도 수정 |
