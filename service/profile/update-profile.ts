import { clerkClient } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";

export type UpdateProfileParams = {
  userId: string;
  username?: string;
  avatarFile?: File | null;
};

export type UpdateProfileResult =
  | { ok: true }
  | {
      ok: false;
      reason: string;
    };

const USERNAME_MIN_LENGTH = 2;

const normalizeUsername = (username?: string): string | undefined => {
  const trimmed = username?.trim();

  if (!trimmed) return undefined;
  if (trimmed.length < USERNAME_MIN_LENGTH) return undefined;

  return trimmed;
};

/**
 * Clerk 사용자 프로필(아이디, 아바타 이미지)을 업데이트한다.
 * - username은 최소 길이를 검증하고 공백을 제거한 뒤 Clerk 사용자 객체에 저장한다.
 * - avatar는 업로드된 파일이 존재할 때만 Clerk 프로필 이미지로 교체한다.
 */
export const updateProfile = async (
  params: UpdateProfileParams
): Promise<UpdateProfileResult> => {
  const { userId, username, avatarFile } = params;
  const client = await clerkClient();

  try {
    const normalizedUsername = normalizeUsername(username);

    await Sentry.startSpan(
      { op: "service.profile.update", name: "Update profile" },
      async (span) => {
        if (normalizedUsername) {
          await client.users.updateUser(userId, {
            username: normalizedUsername,
          });
          span.setAttribute("username.updated", true);
        }

        if (avatarFile instanceof File && avatarFile.size > 0) {
          await client.users.updateUserProfileImage(userId, {
            file: avatarFile,
          });
          span.setAttribute("avatar.updated", true);
        }
      }
    );

    return { ok: true };
  } catch (error) {
    Sentry.captureException(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, reason: message };
  }
};
