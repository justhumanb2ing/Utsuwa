"use client";

import * as React from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/app/onboarding/_actions";

export default function OnboardingComponent() {
  const [error, setError] = React.useState("");
  const { user } = useUser();
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    const res = await completeOnboarding(formData);
    if (res?.message) {
      // Reloads the user's data from the Clerk API
      // 이렇게 하면 user.publicMetadata.onboardingComplete가 업데이트됩니다.
      await user?.reload();

      // user.reload() 후 클라이언트의 publicMetadata가 업데이트되면
      // header-client.tsx에서 자동으로 쿼리가 실행됩니다.
      // 별도의 무효화나 재조회가 필요 없습니다.

      // 홈으로 이동
      router.push(`/profile/@${res.handle}`);
    }
    if (res?.error) {
      setError(res?.error);
    }
  };

  return (
    <div>
      <h1>Welcome</h1>
      <form action={handleSubmit}>
        <div>
          <label>Handle</label>
          <p>Enter the name of your handle</p>
          <input type="text" name="handle" required />
        </div>
        {error && <p className="text-red-600">Error: {error}</p>}
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
