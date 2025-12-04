# 구조화 데이터 (JSON-LD)

- `/`: `WebSite` 스키마를 렌더링해 서비스 메타 정보를 검색엔진에 노출합니다.
- `/sign-in`: `WebPage` + `LoginAction`으로 로그인 페이지임을 명시합니다.
- `/sign-up`: `WebPage` + `RegisterAction`으로 회원가입 페이지임을 명시합니다.
- `/profile/[handle]`: 페이지가 공개(`is_public === true`)일 때만 `ProfilePage` 스키마를 렌더링합니다. 비공개 페이지는 구조화 데이터를 출력하지 않습니다.
- 공통 렌더러 `JsonLd`는 `components/seo/json-ld.tsx`에 위치하며 `<script type="application/ld+json">`를 안전하게 출력합니다.
