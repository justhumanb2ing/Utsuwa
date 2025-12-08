"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/app/(auth)/onboarding/_actions";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { siteConfig } from "@/config/metadata-config";
import { Button } from "../ui/button";
import { LoaderIcon } from "lucide-react";

export default function OnboardingSection() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    const res = await completeOnboarding(formData);
    if (res?.message) {
      // Reloads the user's data from the Clerk API
      // 이렇게 하면 user.publicMetadata.onboardingComplete가 업데이트됩니다.
      await user?.reload();
      setLoading(false);
      // user.reload() 후 클라이언트의 publicMetadata가 업데이트되면
      // header-client.tsx에서 자동으로 쿼리가 실행됩니다.
      // 별도의 무효화나 재조회가 필요 없습니다.

      // 홈으로 이동
      router.push(`/profile/@${res.handle}`);
    }
    if (res?.error) {
      setError(res?.error);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 40 40"
          className="mx-auto size-10"
        >
          <mask
            id="a"
            width="40"
            height="40"
            x="0"
            y="0"
            maskUnits="userSpaceOnUse"
          >
            <circle cx="20" cy="20" r="20" fill="#D9D9D9" />
          </mask>
          <g fill="#0A0A0A" mask="url(#a)">
            <path d="M43.5 3a.5.5 0 0 0 0-1v1Zm0-1h-46v1h46V2ZM43.5 8a.5.5 0 0 0 0-1v1Zm0-1h-46v1h46V7ZM43.5 13a.5.5 0 0 0 0-1v1Zm0-1h-46v1h46v-1ZM43.5 18a.5.5 0 0 0 0-1v1Zm0-1h-46v1h46v-1ZM43.5 23a.5.5 0 0 0 0-1v1Zm0-1h-46v1h46v-1ZM43.5 28a.5.5 0 0 0 0-1v1Zm0-1h-46v1h46v-1ZM43.5 33a.5.5 0 0 0 0-1v1Zm0-1h-46v1h46v-1ZM43.5 38a.5.5 0 0 0 0-1v1Zm0-1h-46v1h46v-1Z" />
            <path d="M27 3.5a1 1 0 1 0 0-2v2Zm0-2h-46v2h46v-2ZM25 8.5a1 1 0 1 0 0-2v2Zm0-2h-46v2h46v-2ZM23 13.5a1 1 0 1 0 0-2v2Zm0-2h-46v2h46v-2ZM21.5 18.5a1 1 0 1 0 0-2v2Zm0-2h-46v2h46v-2ZM20.5 23.5a1 1 0 1 0 0-2v2Zm0-2h-46v2h46v-2ZM22.5 28.5a1 1 0 1 0 0-2v2Zm0-2h-46v2h46v-2ZM25 33.5a1 1 0 1 0 0-2v2Zm0-2h-46v2h46v-2ZM27 38.5a1 1 0 1 0 0-2v2Zm0-2h-46v2h46v-2Z" />
          </g>
        </svg>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-neutral-950">
          Welcome!
        </h1>
      </header>
      <form action={handleSubmit}>
        <div className="*:not-first:mt-2">
          <Label htmlFor="handle" className="sr-only">
            Enter your own handle
          </Label>
          <div className="relative">
            <Input
              id={"handle"}
              name="handle"
              autoFocus
              placeholder="your handle"
              type="text"
              required
              autoComplete="off"
              className="peer ps-44 border-none bg-muted"
            />
            <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground text-sm peer-disabled:opacity-50">
              {siteConfig.url.slice(8)}/@
            </span>
          </div>
          {error && <p className="text-red-600">{error}</p>}
        </div>
        <Button type="submit" className="mt-4 w-full" disabled={loading}>
          {loading ? (
            <LoaderIcon className="size-4 animate-spin" />
          ) : (
            <span>Grab Handle</span>
          )}
        </Button>
      </form>
    </div>
  );
}
