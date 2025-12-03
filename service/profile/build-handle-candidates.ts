const normalizeHandle = (rawHandle: string): string =>
  rawHandle.trim().replace(/^@+/, "");

/**
 * 핸들 원본/정규화/접두 변형을 모두 반환한다.
 */
export const buildHandleCandidates = (rawHandle: string): string[] => {
  const decodedHandle = decodeURIComponent(rawHandle);
  const normalizedHandle = normalizeHandle(decodedHandle);
  const prefixedHandle = normalizedHandle ? `@${normalizedHandle}` : "";

  return [decodedHandle, normalizedHandle, prefixedHandle].filter(
    (candidate, index, self) => candidate && self.indexOf(candidate) === index
  );
};
