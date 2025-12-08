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
import { cn } from "@/lib/utils";

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
      <header className="text-left space-y-2">
        <h1 className="mt-4 text-3xl font-bold tracking-tight">
          Claim your unique handle!
        </h1>
        <h2 className="text-neutral-500">This will become your public link</h2>
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
              className={cn(
                "peer ps-44 border-none",
                "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                "bg-muted shadow-none h-12 rounded-xl",
                "data-invalid:border-destructive data-invalid:text-destructive"
              )}
            />
            <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground text-sm peer-disabled:opacity-50">
              {siteConfig.url.slice(8)}/@
            </span>
          </div>
          {error && <p className="text-red-600">{error}</p>}
        </div>
        <Button
          type="submit"
          className="mt-4 w-full rounded-xl"
          size={"lg"}
          disabled={loading}
        >
          {loading ? (
            <LoaderIcon className="size-4 animate-spin" />
          ) : (
            <span>Grab it!</span>
          )}
        </Button>
      </form>
    </div>
  );
}
