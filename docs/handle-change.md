# 페이지 Handle 변경 흐름

- 위치: `app/api/pages/[pageId]/handle/route.ts`, `hooks/use-page-form.ts`, `service/pages/change-handle.ts`
- 목적: 페이지 소유자가 핸들(`pages.handle`)을 변경하면 새로운 `/profile/[handle]` 경로로 라우팅하고, 전역에서 고유성을 보장한다.

## 유효성 규칙
- 정규식: `^[a-z0-9]{3,20}$` (소문자·숫자만 허용, 3~20자)
- 예약어 차단: `admin`, `profile`, `api`, `settings`, `login`, `signup`, `register`, `auth`
- 입력 시 `@`는 허용하지 않으며, 서버 전송 시 내부적으로만 `@`를 접두해 보낸다.

## API
- **PATCH** `/api/pages/[pageId]/handle`
- 요청: `{ "handle": "<normalized handle>" }`
- 성공: `{ "status": "success", "handle": "<normalized>" }`
- 충돌: `409 { "status": "error", "reason": "HANDLE_ALREADY_EXISTS" }`
- 권한 없음: `403 { "status": "error", "reason": "NOT_AUTHORIZED" }`
- 서버는 DB 고유성(UNIQUE), RLS(소유자) 재확인 후 이전/새 핸들 경로 모두 `revalidatePath` 한다.

## 클라이언트 흐름
- 핸들 변경은 전용 `HandleChangeForm`(소유자만 렌더링)에서 수행한다. 입력에 `@`가 포함되면 즉시 에러를 표시하며, 유효성 실패 시 `FormMessage`로 안내한다.
- 성공 시 `router.replace("/profile/<new>")` 후 `router.refresh()`로 새로운 핸들 경로로 이동한다.
- 페이지 메타 정보(title/description/image)는 기존 `ProfileForm` + `usePageForm`에서 별도로 자동 저장하며 핸들 변경 로직과 분리된다.

## 캐시/무효화
- 뮤테이션 시 React Query 캐시:
  - 소유자 페이지 리스트(`pageQueryOptions.byOwner`) 취소/무효화
  - 프로필 BFF(`profileQueryOptions.byHandle`)는 이전/새 핸들 모두(원본, 정규화, `@` 접두 포함) 무효화
- 서버 revalidate: `/profile/[handle]`, `/api/profile/[handle]` 각각 이전·새 핸들 모든 표현(원본/정규화/접두) 대상
