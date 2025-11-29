"use client";

import Link from "next/link";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

type HeaderClientProps = {
  profileHref: string;
  pageLinks: Array<{ id: string; href: string; label: string }>;
};

const PageLinks = ({
  pageLinks,
}: {
  pageLinks: HeaderClientProps["pageLinks"];
}) =>
  pageLinks.length > 0 ? (
    <nav className="flex flex-wrap items-center gap-2">
      {pageLinks.map((page) => (
        <Link
          key={page.id}
          href={page.href}
          className="px-3 py-1 text-sm text-zinc-900 transition hover:bg-zinc-100"
        >
          {page.label}
        </Link>
      ))}
    </nav>
  ) : null;

export default function HeaderClient({
  profileHref,
  pageLinks,
}: HeaderClientProps) {
  return (
    <header className="flex justify-end items-center p-4 gap-4 h-16">
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
          <PageLinks pageLinks={pageLinks} />
          <UserButton />
        </div>
      </SignedIn>
    </header>
  );
}
