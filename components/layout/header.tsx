import { currentUser } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import type { OwnerPages } from "@/service/pages/fetch-pages-by-owner";
import { fetchPagesByOwnerId } from "@/service/pages/fetch-pages-by-owner";
import HeaderClient from "./header-client";

type PageLink = {
  id: string;
  href: string;
  label: string;
};

const normalizeHandle = (rawHandle: string): string =>
  rawHandle.trim().replace(/^@+/, "");

const buildProfilePath = (handle: string): string => {
  const normalized = normalizeHandle(handle);
  return normalized ? `/profile/@${normalized}` : "/profile";
};

const toPageLinks = (pages: OwnerPages): PageLink[] =>
  pages.map((page) => {
    const href = buildProfilePath(page.handle);
    const label = page.title?.trim() || page.handle;

    return { id: page.id, href, label };
  });

export default async function Header() {
  const user = await currentUser();

  const profileHref = buildProfilePath(
    typeof user?.publicMetadata?.handle === "string"
      ? user.publicMetadata.handle
      : ""
  );

  let pageLinks: PageLink[] = [];

  if (user?.id) {
    try {
      const pages = await fetchPagesByOwnerId(user.id);
      pageLinks = toPageLinks(pages);
    } catch (error) {
      Sentry.captureException(error);
    }
  }

  return (
    <HeaderClient profileHref={profileHref} pageLinks={pageLinks} />
  );
}
