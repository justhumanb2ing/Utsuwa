const HANDLE_PATTERN = /^[a-z0-9]{3,20}$/;

const RESERVED_HANDLES = [
  "admin",
  "profile",
  "api",
  "settings",
  "login",
  "signup",
  "register",
  "auth",
] as const;

const RESERVED_HANDLE_SET = new Set<string>(RESERVED_HANDLES);

export type HandleValidationResult =
  | { ok: true; normalized: string }
  | {
      ok: false;
      reason:
        | "INVALID_FORMAT"
        | "RESERVED"
        | "CONTAINS_AT_SYMBOL"
        | "INVALID_CASE";
    };

/**
 * 입력된 핸들을 전처리한다.
 * - 앞뒤 공백과 선행 @를 제거하고 소문자로 통일한다.
 */
export const normalizeHandle = (rawHandle: string): string =>
  rawHandle.trim().replace(/^@+/, "").toLowerCase();

/**
 * 핸들이 예약어인지 여부를 확인한다.
 */
export const isReservedHandle = (handle: string): boolean =>
  RESERVED_HANDLE_SET.has(handle);

/**
 * 페이지 핸들 입력을 검증한다.
 * - 정규식(소문자, 숫자, -, _)과 길이(3~20자) 확인
 * - 예약어 차단
 */
export const validateHandle = (rawHandle: string): HandleValidationResult => {
  const trimmed = rawHandle.trim();
  const withoutPrefix = trimmed.replace(/^@+/, "");

  if (withoutPrefix.includes("@")) {
    return { ok: false, reason: "CONTAINS_AT_SYMBOL" };
  }

  const lowercased = withoutPrefix.toLowerCase();
  if (withoutPrefix !== lowercased) {
    return { ok: false, reason: "INVALID_CASE" };
  }

  if (!HANDLE_PATTERN.test(withoutPrefix)) {
    return { ok: false, reason: "INVALID_FORMAT" };
  }

  if (isReservedHandle(lowercased)) {
    return { ok: false, reason: "RESERVED" };
  }

  return { ok: true, normalized: lowercased };
};

/**
 * DB에 저장할 때 사용하는 표준 형태(@ 접두사 부여).
 */
export const formatStoredHandle = (normalized: string): string =>
  `@${normalized}`;

export const handleRules = {
  pattern: HANDLE_PATTERN,
  reserved: RESERVED_HANDLES,
} as const;
