"use client";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { useFunnel } from "@use-funnel/browser";
import { ProfileBffPayload } from "@/types/profile";
import { SupabaseClient } from "@supabase/supabase-js";
import { Button } from "../ui/button";
import { useClerk } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Settings2Icon,
} from "lucide-react";
import { HandleChangeForm } from "./handle-change-form";
import { PageVisibilityToggle } from "./page-visibility-toggle";
import { useEffect } from "react";

interface SettingMobileSheetProps {
  profile: Pick<ProfileBffPayload, "isOwner" | "page">;
  supabase: SupabaseClient;
  userId: string | null;
}

type SettingMobileFunnelContext = {
  SettingList: { handle: string };
  HandleChange: { handle: string };
};

export default function SettingMobileSheet({
  profile,
  supabase,
  userId,
}: SettingMobileSheetProps) {
  const { isOwner, page } = profile;
  const { signOut } = useClerk();
  const pathname = usePathname();
  const funnel = useFunnel<SettingMobileFunnelContext>({
    id: "setting-mobile-sheet",
    initial: {
      step: "SettingList",
      context: { handle: page.handle },
    },
  });

  useEffect(() => {
    return () => {
      funnel.history.replace("SettingList", (prev) => ({
        ...prev,
        handle: page.handle,
      }));
    };
  }, []);

  if (!isOwner) return null;

  return (
    <Drawer
    // onOpenChange={(open) => {
    //   if (!open) {
    //     void funnel.history.replace("SettingList", (prev) => ({
    //       ...prev,
    //       handle: page.handle,
    //     }));
    //   }
    // }}
    >
      <DrawerTrigger asChild>
        <Button variant="outline" size={"icon-sm"} className="">
          <Settings2Icon />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader hidden>
            <DrawerTitle hidden></DrawerTitle>
            <DrawerDescription hidden></DrawerDescription>
          </DrawerHeader>
          <div className="py-8 h-[500px] relative">
            <funnel.Render
              SettingList={({ context, history }) => (
                <div className="flex flex-col justify-between gap-2 h-full">
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        history.push("HandleChange", {
                          handle: context.handle,
                        })
                      }
                      className="w-full flex justify-between items-center h-16 py-10 rounded-xl text-sm hover:bg-muted p-4 text-left"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">Change Handle</p>
                        <p className="text-muted-foreground">{page.handle}</p>
                      </div>
                      <ArrowRightIcon className="size-4" />
                    </button>
                    <div className="rounded-xl hover:bg-muted p-4">
                      <PageVisibilityToggle
                        profile={profile}
                        supabase={supabase}
                        userId={userId}
                      />
                    </div>
                  </div>
                  <footer>
                    <Button
                      variant={"ghost"}
                      onClick={() => signOut({ redirectUrl: pathname })}
                      className="w-full text-sm flex-row justify-center items-center gap-1 text-brand-poppy hover:text-brand-poppy-hover hover:bg-inherit"
                    >
                      <div className="py-1">Logout</div>
                    </Button>
                  </footer>
                </div>
              )}
              HandleChange={funnel.Render.overlay({
                render: ({ close }) => (
                  <div className="absolute inset-0 z-10 bg-background pt-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        type="button"
                        onClick={close}
                        aria-label="설정 목록으로 돌아가기"
                      >
                        <ArrowLeftIcon className="size-4" />
                      </Button>
                      <p className="text-sm font-semibold">Change Handle</p>
                      <div className="w-9" />
                    </div>
                    <HandleChangeForm
                      profile={profile}
                      supabase={supabase}
                      userId={userId}
                    />
                  </div>
                ),
              })}
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>

    // <Sheet>
    //   <SheetTrigger render={<Button variant="outline" />}>
    //     Open Sheet
    //   </SheetTrigger>
    //   <SheetPopup inset showCloseButton={false} side="bottom" className={""}>
    //     <SheetHeader>
    //       <SheetTitle className={"font-black"}>Setting</SheetTitle>
    //     </SheetHeader>
    //     <SheetPanel>
    //   <Button
    //     variant={"ghost"}
    //     size={"lg"}
    //     className="w-full flex justify-between items-center h-16 py-10 rounded-xl"
    //   >
    //     <div className="space-y-1 text-left text-base">
    //       <p>Change Handle</p>
    //       <p className="text-muted-foreground">{page.handle}</p>
    //     </div>
    //     <ArrowUpRightIcon />
    //   </Button>
    //       <p>
    //         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
    //         eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
    //         ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
    //         aliquip ex ea commodo consequat. Duis aute irure dolor in
    //         reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
    //         pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
    //         culpa qui officia deserunt mollit anim id est laborum.
    //       </p>
    //     </SheetPanel>
    //   </SheetPopup>
    // </Sheet>
  );
}
