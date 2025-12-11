# Block Registry

- 블록 버튼을 클릭하면 `createBlockAction`(server action)이 호출되어 Supabase에 블록 컨테이너를 생성하고 `blockId`를 반환합니다. 성공 후 `router.refresh()`로 페이지를 갱신해 placeholder를 보여줍니다.
- 블록 버튼 클릭 시 `/api/profile/block` POST로 컨테이너를 생성하고 `blockId`를 반환받습니다. 성공 후 `router.refresh()`로 placeholder를 갱신합니다.
- 업로드 UI(`ui === "upload"`)는 컨테이너 생성 직후 파일 선택창을 띄웁니다. 실제 업로드 처리는 `onUploadFile` 콜백을 주입해 연결하며, 기본 구현은 콘솔 안내만 수행합니다.
- 권한 검증과 DB insert는 `service/blocks/create-block.ts`에서 처리합니다. 페이지 소유자를 확인한 뒤 `blocks` 테이블에 한 행을 추가합니다.
- `BLOCK_REGISTRY`(config/block-registry.ts)를 block_type enum 기반으로 정의해 키/타입 정합성을 유지합니다. UI 힌트는 `components/layout/block-registry.tsx`의 `BLOCK_UI_HINT`에서 관리합니다.
- 블록 삭제는 `service/blocks/delete-block.ts` → `/api/profile/block` DELETE 순으로 호출되며, 페이지 소유자 여부를 확인한 뒤 타입별 상세 테이블(`block_link`, `block_text`, `block_image`, `block_video`, `block_map`)을 정리하고 `blocks` 행을 제거합니다. 성공 시 `/profile/[handle]` 캐시를 `revalidatePath`로 무효화합니다.
- Bento(4×4) 레이아웃: DnD 종료 시 블록 배열 순서대로 4×4 그리드에 충돌 없는 위치(x, y)를 다시 계산하고, `save_block_layout` RPC(`p_page_id`, `p_blocks`)에 `{ id, x, y, w, h }[]`를 debounce 300ms로 전달합니다. 기본 블록은 w,h가 1~2 범위이며, 섹션 블록은 풀폭 4×1을 기본으로 가진다. 레이아웃은 (x+w)≤4, (y+h)≤4를 만족해야 한다.
- Section 블록: 툴바에서 Section을 선택하면 기본 4×1 크기로 생성되며, 호버 상태에서만 삭제 버튼을 노출한다. 섹션 텍스트는 헤더용 텍스트 영역으로 작성/저장한다.
