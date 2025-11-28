import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <ProfileForm
        defaultUsername={user.username ?? ""}
        currentAvatarUrl={user.imageUrl ?? undefined}
      />
    </div>
  );
}
