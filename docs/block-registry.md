# Block Registry

- 블록 버튼 클릭 시 클라이언트가 `LayoutItem`을 생성해 `service/layouts/add-layout-item.ts`를 통해 `page_layouts`에 스냅샷으로 저장한다. 별도 block_* 테이블 삽입/조회는 없다.
- 업로드 UI(`ui === "upload"`)는 레이아웃 아이템 생성 직후 파일 선택창을 띄우며, 실제 업로드는 `onUploadFile` 콜백으로 연결한다.
- 링크 블록은 툴바 팝오버에서 URL을 입력해 `supabase.functions.invoke("url-parser")`로 메타데이터를 가져오고, 응답의 `title`·`faviconUrl`(필수), `siteName`·`imageUrl`(확장 레이아웃)을 포함해 즉시 저장/렌더링한다. 기본 2×2는 제목+파비콘만 노출한다.
- `BLOCK_REGISTRY`(config/block-registry.ts)를 block_type enum 기반으로 정의해 키/타입 정합성을 유지하고, UI 힌트는 `components/layout/block-registry.tsx`의 `BLOCK_UI_HINT`에서 관리한다.
- 블록 삭제는 `service/layouts/delete-layout-item.ts` 호출로 layout.items에서 제거한 뒤 저장하며, 권한 검증은 Supabase RLS에 맡긴다.
- Bento(4×4) 레이아웃: DnD 종료 시 `layoutMutationOptions.saveLayout`이 `{ id, x, y, w, h }[]`를 현재 layout에 병합한 뒤 `update_page_layout` RPC로 저장한다. 기본 블록은 w,h가 1~2 범위이며, 섹션 블록은 풀폭 4×1을 기본으로 가진다.
- Section 블록: 툴바에서 Section을 선택하면 기본 4×1 크기로 생성되며, 호버 상태에서만 삭제 버튼을 노출한다. 섹션 텍스트는 헤더용 텍스트 영역으로 작성/저장한다.
