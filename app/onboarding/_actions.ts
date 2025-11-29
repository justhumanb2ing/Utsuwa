"use server";

import { createServerSupabaseClient } from "@/config/supabase";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const completeOnboarding = async (formData: FormData) => {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated) return { message: "No Logged In User" };

  const supabase = await createServerSupabaseClient();
  const rawInput = (formData.get("handle") as string)?.trim();

  if (!rawInput) return { error: "Handle is required." };

  // validate only english + numeric allowed
  const isValid = /^[a-zA-Z0-9]+$/.test(rawInput);
  if (!isValid)
    return { error: "Only english letters and numbers are allowed." };

  // enforce @ prefix consistently in DB
  const storedHandle = `@${rawInput}`;

  // Check availability in pages table
  const { data: existing, error: lookupError } = await supabase
    .from("pages")
    .select("id")
    .eq("handle", storedHandle)
    .maybeSingle();

  if (lookupError) {
    console.error("Supabase lookup error", lookupError);
    return { error: "Error checking handle" };
  }

  if (existing) {
    return { error: "Handle already exists" };
  }

  // Insert default initial page
  const { error: insertError } = await supabase.from("pages").insert({
    owner_id: userId,
    handle: storedHandle,
    title: `${rawInput}'s Space`, // uses clean raw input without @
    is_public: true,
    ordering: 0,
  });

  if (insertError) {
    console.error("Page insert error", insertError);
    return { error: "Error creating page" };
  }

  // Update Clerk metadata: onboarding complete only
  const client = await clerkClient();
  await client.users.updateUser(userId, {
    publicMetadata: {
      onboardingComplete: true,
    },
  });

  return { message: "Onboarding complete", handle: storedHandle };
};
