import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { ProfileBffPayload } from "@/types/profile";
import { SupabaseClient } from "@supabase/supabase-js";
import { Button } from "../ui/button";
import { useClerk } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { ArrowRightIcon, Settings2Icon } from "lucide-react";
import { PageVisibilityToggle } from "./page-visibility-toggle";

interface SettingMobileSheetProps {
  profile: Pick<ProfileBffPayload, "isOwner" | "page">;
  supabase: SupabaseClient;
  userId: string | null;
}

export default function SettingMobileSheet({
  profile,
  supabase,
  userId,
}: SettingMobileSheetProps) {
  const { isOwner, page } = profile;
  const { signOut } = useClerk();
  const pathname = usePathname();

  if (!isOwner) return null;

  return (
    <Drawer>
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
          <div className="py-8 h-[400px] flex flex-col gap-2">
            <div className="w-full flex justify-between items-center h-16 py-10 rounded-xl text-sm hover:bg-muted p-4">
              <div className="space-y-1 text-left">
                <p className="font-medium">Change Handle</p>
                <p className="text-muted-foreground">{page.handle}</p>
              </div>
              <ArrowRightIcon className="size-4" />
            </div>
            <div className="rounded-xl hover:bg-muted p-4">
              <PageVisibilityToggle
                profile={profile}
                supabase={supabase}
                userId={userId}
              />
            </div>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button
                variant={"ghost"}
                onClick={() => signOut({ redirectUrl: pathname })}
                className="w-full text-sm flex-row justify-center items-center gap-1 text-brand-poppy hover:text-brand-poppy-hover hover:bg-inherit"
              >
                <div className="py-1">Logout</div>
              </Button>
            </DrawerClose>
          </DrawerFooter>
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
