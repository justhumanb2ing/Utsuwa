"use client";

import Image from "next/image";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import {
  updateProfileAction,
  type UpdateProfileActionState,
} from "@/app/profile/_actions";
import { toastManager } from "@/components/ui/toast";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { Textarea } from "../ui/textarea";

type ProfileFormProps = {
  handle: string;
  isOwner: boolean;
  pageTitle?: string;
  pageDescription?: string;
  profileAvatarUrl?: string;
};

const initialState: UpdateProfileActionState = { status: "idle" };

const SubmitButton = ({
  disabled,
  pending,
}: {
  disabled: boolean;
  pending: boolean;
}) => (
  <button
    type="submit"
    disabled={disabled || pending}
    className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
  >
    {pending ? "변경 중..." : "변경"}
  </button>
);

export const ProfileForm = ({
  handle,
  isOwner,
  pageTitle,
  pageDescription,
  profileAvatarUrl,
}: ProfileFormProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const initialTitle = pageTitle ?? "";
  const initialDescription = pageDescription ?? "";

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [baselineTitle, setBaselineTitle] = useState(initialTitle.trim());
  const [baselineDescription, setBaselineDescription] = useState(
    initialDescription.trim()
  );
  const [avatarPreview, setAvatarPreview] = useState(profileAvatarUrl ?? "");
  const [hasAvatarSelection, setHasAvatarSelection] = useState(false);

  const normalizedTitle = useMemo(() => title.trim(), [title]);
  const normalizedDescription = useMemo(
    () => description.trim(),
    [description]
  );
  const hasTitleChanged = normalizedTitle !== baselineTitle;
  const hasDescriptionChanged = normalizedDescription !== baselineDescription;
  const hasChanges =
    hasTitleChanged || hasDescriptionChanged || hasAvatarSelection;

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handleAvatarClick = () => {
    if (!isOwner) return;
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOwner) return;
    const file = event.target.files?.[0];

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (file) {
      const nextUrl = URL.createObjectURL(file);
      objectUrlRef.current = nextUrl;
      setAvatarPreview(nextUrl);
      setHasAvatarSelection(true);
    } else {
      setAvatarPreview(profileAvatarUrl ?? "");
      setHasAvatarSelection(false);
    }
  };

  const actionWithToast = async (
    prevState: UpdateProfileActionState,
    formData: FormData
  ) => {
    if (!isOwner) return prevState;

    const loadingId = toastManager.add({
      title: "프로필 저장 중…",
      description: "잠시만 기다려 주세요.",
      type: "loading",
      timeout: 0,
    });

    try {
      const response = await updateProfileAction(prevState, formData);

      if (response.status === "error") {
        throw new Error(response.reason ?? response.message);
      }

      toastManager.update(loadingId, {
        title: "프로필 업데이트 완료",
        description: response.message ?? "프로필이 저장되었습니다.",
        type: "success",
      });

      setBaselineTitle(normalizedTitle);
      setBaselineDescription(normalizedDescription);
      setHasAvatarSelection(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return response;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "잠시 후 다시 시도해 주세요.";

      toastManager.update(loadingId, {
        title: "업데이트 실패",
        description: message,
        type: "error",
      });

      return {
        status: "error",
        message: "프로필 업데이트에 실패했어요.",
        reason: message,
      } satisfies UpdateProfileActionState;
    }
  };

  const [, formAction, isPending] = useActionState(
    actionWithToast,
    initialState
  );

  return (
    <form action={isOwner ? formAction : undefined} className="space-y-5">
      <input type="hidden" name="handle" value={handle} />
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <input
            id="avatar"
            name="avatar"
            type="file"
            accept="image/*"
            ref={fileInputRef}
            hidden
            onChange={handleAvatarChange}
            className="block w-full text-sm text-zinc-600 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-900 hover:file:bg-zinc-200"
          />
          <Button
            type="button"
            onClick={handleAvatarClick}
            className="size-40 p-0 aspect-square overflow-hidden rounded-full ring ring-zinc-200 transition focus:outline-none focus:ring-2 focus:ring-zinc-200"
            aria-label="프로필 이미지 변경"
            variant={"ghost"}
          >
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="현재 아바타"
                width={100}
                height={100}
                className="aspect-square object-cover w-full h-full"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-50 text-xs text-zinc-500">
                이미지 선택
              </div>
            )}
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Input
          id="title"
          name="title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          readOnly={!isOwner}
          placeholder="페이지 제목"
          className={cn(
            "w-full rounded-md border-0 shadow-none px-3 py-2 !text-5xl !font-bold text-zinc-900 h-20 p-0",
            "focus:outline-none focus:ring-0 focus-visible:ring-0"
          )}
        />
      </div>
      <div className="space-y-2">
        <Textarea
          id="description"
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          readOnly={!isOwner}
          placeholder="페이지 설명을 입력하세요"
          className={cn(
            "w-full border-none rounded-none shadow-none text-zinc-900 min-h-[80px] p-0 !text-lg resize-none",
            "focus-visible:outline-none focus-visible:ring-0"
          )}
        />
      </div>
      {isOwner && <SubmitButton pending={isPending} disabled={!hasChanges} />}
    </form>
  );
};
