import type { BlockKey } from "@/config/block-registry";
import type { BlockLayout } from "@/service/blocks/block-layout";

export type BlockEditorState = {
  placeholders: { id: string; type: BlockKey }[];
  deletingBlockIds: Set<string>;
  latestLayout: BlockLayout[] | null;
  saveState: "idle" | "dirty" | "saving" | "saved" | "error";
  pendingAutoSave: boolean;
};

export type BlockEditorAction =
  | { type: "ADD_PLACEHOLDER"; blockType: BlockKey }
  | { type: "CANCEL_PLACEHOLDER"; placeholderId: string }
  | { type: "DELETE_BLOCK_START"; blockId: string }
  | { type: "DELETE_BLOCK_FINISH"; blockId: string }
  | { type: "SAVE_PLACEHOLDER_START"; placeholderId: string }
  | { type: "LAYOUT_CHANGED"; layout: BlockLayout[] }
  | { type: "MARK_DIRTY" }
  | { type: "AUTO_SAVE_START" }
  | { type: "AUTO_SAVE_SUCCESS" }
  | { type: "AUTO_SAVE_ERROR" }
  | { type: "REQUEST_AUTO_SAVE" };

export const initialBlockEditorState: BlockEditorState = {
  placeholders: [],
  deletingBlockIds: new Set(),
  latestLayout: null,
  saveState: "idle",
  pendingAutoSave: false,
};

/**
 * 프로필 블록 에디터의 상태 머신 리듀서.
 * UI 이벤트로부터 전달된 액션을 순수 상태 변경으로 변환한다.
 */
export function blockEditorReducer(
  state: BlockEditorState,
  action: BlockEditorAction
): BlockEditorState {
  switch (action.type) {
    case "ADD_PLACEHOLDER":
      return {
        ...state,
        placeholders: [
          ...state.placeholders,
          { id: crypto.randomUUID(), type: action.blockType },
        ],
        saveState: "dirty",
      };

    case "CANCEL_PLACEHOLDER":
      {
        const nextPlaceholders = state.placeholders.filter(
          (placeholder) => placeholder.id !== action.placeholderId
        );
        const shouldResetSaveState =
          nextPlaceholders.length === 0 &&
          !state.pendingAutoSave &&
          state.latestLayout === null;

      return {
        ...state,
        placeholders: nextPlaceholders,
        saveState: shouldResetSaveState ? "idle" : state.saveState,
      };
      }

    case "DELETE_BLOCK_START":
      return {
        ...state,
        deletingBlockIds: new Set([...state.deletingBlockIds, action.blockId]),
      };

    case "DELETE_BLOCK_FINISH":
      return {
        ...state,
        deletingBlockIds: new Set(
          [...state.deletingBlockIds].filter((id) => id !== action.blockId)
        ),
        latestLayout: state.latestLayout
          ? state.latestLayout.filter((layout) => layout.id !== action.blockId)
          : state.latestLayout,
      };

    case "SAVE_PLACEHOLDER_START":
      return {
        ...state,
        placeholders: state.placeholders.filter(
          (placeholder) => placeholder.id !== action.placeholderId
        ),
      };

    case "LAYOUT_CHANGED":
      return {
        ...state,
        latestLayout: action.layout,
      };

    case "MARK_DIRTY":
      return {
        ...state,
        saveState: "dirty",
      };

    case "AUTO_SAVE_START":
      return {
        ...state,
        saveState: "saving",
        pendingAutoSave: true,
      };

    case "AUTO_SAVE_SUCCESS":
      return {
        ...state,
        saveState: "saved",
        pendingAutoSave: false,
      };

    case "AUTO_SAVE_ERROR":
      return {
        ...state,
        saveState: "error",
        pendingAutoSave: false,
      };

    case "REQUEST_AUTO_SAVE":
      if (!state.latestLayout) {
        return {
          ...state,
          saveState: "dirty",
        };
      }
      return {
        ...state,
        saveState: "dirty",
        pendingAutoSave: true,
      };

    default:
      return state;
  }
}
