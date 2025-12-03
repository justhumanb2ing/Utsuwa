"use client";

import Link from "next/link";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import { useMemo } from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary, Suspense } from "@suspensive/react";
import { SuspenseQuery } from "@suspensive/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/config/supabase-browser";
import { Item } from "@/components/ui/item";
import { pageQueryOptions } from "@/service/pages/page-query-options";

type HeaderClientProps = {
  userId: string | null;
  canLoadPages: boolean;
};

const normalizeHandle = (rawHandle: string): string =>
  rawHandle.trim().replace(/^@+/, "");

const buildProfilePath = (handle: string): string => {
  const normalized = normalizeHandle(handle);
  return normalized ? `/profile/@${normalized}` : "/profile";
};

export default function HeaderClient({
  userId,
  canLoadPages,
}: HeaderClientProps) {
  const { getToken } = useAuth();
  const supabase: SupabaseClient = useMemo(
    () => createBrowserSupabaseClient(() => getToken()),
    [getToken]
  );

  return (
    <Item
      asChild
      className="flex justify-end items-center p-4 gap-4 h-16 border-none bg-transparent shadow-none"
    >
      <header>
        <SignedOut>
          <SignInButton />
          <SignUpButton>
            <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
              Sign Up
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <div className="flex items-center gap-3">
            {canLoadPages && userId ? (
              <QueryErrorResetBoundary>
                {({ reset }) => (
                  <ErrorBoundary onReset={reset} fallback={<div>Error</div>}>
                    <Suspense fallback={<div>Loading</div>}>
                      <SuspenseQuery
                        {...pageQueryOptions.byOwner(userId, supabase, userId)}
                        select={(pages) =>
                          pages.map((page) => {
                            const href = buildProfilePath(page.handle);
                            const label = page.handle

                            return { id: page.id, href, label };
                          })
                        }
                      >
                        {({ data: pageLinks }) =>
                          pageLinks.map((page) => (
                            <Link
                              key={page.id}
                              href={page.href}
                              className="px-3 py-1 text-sm text-zinc-900 transition hover:bg-zinc-100"
                            >
                              {page.label}
                            </Link>
                          ))
                        }
                      </SuspenseQuery>
                    </Suspense>
                  </ErrorBoundary>
                )}
              </QueryErrorResetBoundary>
            ) : null}

            <UserButton />
          </div>
        </SignedIn>
      </header>
    </Item>
  );
}
