# ProfileForm 메모

- 위치: `components/profile/profile-form.tsx`
- 제목/설명 입력 필드는 `contentEditable`한 `<p>`를 사용해 기존 인풋 대비 동일한 저장 플로우(RHF + `usePageForm` 자동 저장)를 유지한다.
- 반응형: 화면이 좁아질 때를 대비해 `truncate` + `line-clamp`로 텍스트를 숨기되, 포커스 시에는 `line-clamp-none`로 풀어 전체 내용을 편집할 수 있다.
- placeholder는 `:empty:before`로 노출해 기존 플레이스홀더 UX를 유지한다.
- 커서 점프 방지: `ref`로 DOM 텍스트를 직접 동기화해 입력 시 캐럿이 앞으로 이동하지 않는다.
