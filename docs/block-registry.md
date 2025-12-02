# Block Registry

- 블록 버튼을 클릭하면 `createBlockAction`(server action)이 호출되어 Supabase에 블록 컨테이너를 생성하고 `blockId`를 반환합니다. 성공 후 `router.refresh()`로 페이지를 갱신해 placeholder를 보여줍니다.
- 블록 버튼 클릭 시 `/api/profile/block` POST로 컨테이너를 생성하고 `blockId`를 반환받습니다. 성공 후 `router.refresh()`로 placeholder를 갱신합니다.
- 업로드 UI(`ui === "upload"`)는 컨테이너 생성 직후 파일 선택창을 띄웁니다. 실제 업로드 처리는 `onUploadFile` 콜백을 주입해 연결하며, 기본 구현은 콘솔 안내만 수행합니다.
- 권한 검증과 DB insert는 `service/blocks/create-block.ts`에서 처리합니다. 페이지 소유자를 확인한 뒤 `blocks` 테이블에 한 행을 추가합니다.
- `BLOCK_REGISTRY`(config/block-registry.ts)를 block_type enum 기반으로 정의해 키/타입 정합성을 유지합니다. UI 힌트는 `components/layout/block-registry.tsx`의 `BLOCK_UI_HINT`에서 관리합니다.
- 블록 삭제는 `service/blocks/delete-block.ts` → `/api/profile/block` DELETE 순으로 호출되며, 페이지 소유자 여부를 확인한 뒤 타입별 상세 테이블(`block_link`, `block_text`, `block_image`, `block_video`, `block_map`)을 정리하고 `blocks` 행을 제거합니다. 성공 시 `/profile/[handle]` 캐시를 `revalidatePath`로 무효화합니다.
