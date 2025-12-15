/* eslint-disable react-hooks/rules-of-hooks */
import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Loader2 } from "lucide-react";
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
} from "../ui/toolbar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import SavingStatusSection from "./saving-status-section";
import { BLOCK_REGISTRY, BlockConfig, BlockKey } from "@/config/block-registry";
import { cn } from "@/lib/utils";

interface FixedToolbarProps {
  isVisible: boolean;
  addPlaceholder: (key: BlockKey) => void;
  onUploadImage?: (file: File) => void;
  onCreateLinkBlock?: (url: string) => Promise<void>;
}

export default function FixedToolbar({
  isVisible,
  addPlaceholder,
  onUploadImage,
  onCreateLinkBlock,
}: FixedToolbarProps) {
  if (!isVisible) return null;

  const registryEntries = Object.entries(BLOCK_REGISTRY) as [
    BlockKey,
    BlockConfig
  ][];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();
  const linkInputId = useId();
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUploadImage?.(file);
    }
    event.target.value = "";
  };

  const handleButtonClick = (key: BlockKey, item: BlockConfig) => {
    setIsLinkPopoverOpen(false);

    if (item.ui === "upload" && key === "image") {
      if (onUploadImage) {
        fileInputRef.current?.click();
        return;
      }
    }
    addPlaceholder(key);
  };

  const handleLinkSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!onCreateLinkBlock) return;
    if (isSubmittingLink) return;

    const trimmedUrl = linkUrl.trim();
    if (!trimmedUrl) return;

    setIsSubmittingLink(true);
    try {
      await onCreateLinkBlock(trimmedUrl);
      setLinkUrl("");
      setIsLinkPopoverOpen(false);
    } catch {
      // 에러 토스트는 상위에서 처리한다.
    } finally {
      setIsSubmittingLink(false);
    }
  };

  return (
    <Toolbar
      className={cn(
        "fixed bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 drop-shadow-sm",
        "pointer-events-auto bg-black/80 backdrop-blur-md p-1 rounded-xl flex gap-1 shadow-xl border border-black animate-in fade-in zoom-in duration-200 items-center"
      )}
    >
      <input
        ref={fileInputRef}
        id={fileInputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <ToolbarGroup>
        {registryEntries.map(([key, item]) => {
          const Icon = item.icon;

          if (key === "link") {
            const isSubmitDisabled =
              isSubmittingLink || linkUrl.trim().length === 0;

            return (
              <Popover
                key={key}
                open={isLinkPopoverOpen}
                onOpenChange={(open) => {
                  setIsLinkPopoverOpen(open);
                  if (!open) {
                    setIsSubmittingLink(false);
                    setLinkUrl("");
                  }
                }}
              >
                <PopoverTrigger
                  render={
                    <ToolbarButton
                      aria-label={`${item.label} block`}
                      className={
                        "p-2 text-white hover:bg-background/10 rounded-lg"
                      }
                    />
                  }
                >
                  <Icon className="h-6 w-6" weight="fill" />
                </PopoverTrigger>
                <PopoverContent
                  className="w-[320px] bg-background/95 backdrop-blur border-brand-cloud/60 rounded-xl overflow-hidden"
                  side="top"
                  align="center"
                  sideOffset={12}
                >
                  <form className="space-y-2" onSubmit={handleLinkSubmit}>
                    <div className="relative">
                      <Input
                        id={linkInputId}
                        name={linkInputId}
                        value={linkUrl}
                        onChange={(event) => setLinkUrl(event.target.value)}
                        placeholder="https://example.com"
                        autoComplete="url"
                        autoFocus
                        disabled={isSubmittingLink}
                        className="pr-28 focus-visible:ring-0 ring-0 border-none h-10 py-6"
                      />
                      <div className="absolute inset-y-0 end-2 flex items-center justify-center">
                        <Button
                          type="submit"
                          size="sm"
                          className="bg-brand-indigo hover:bg-brand-indigo-hover"
                          disabled={isSubmitDisabled}
                        >
                          {isSubmittingLink ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Add"
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </PopoverContent>
              </Popover>
            );
          }

          return (
            <ToolbarButton
              key={key}
              aria-label={`${item.label} block`}
              onClick={() => handleButtonClick(key, item)}
              className={"p-2 text-white hover:bg-background/10 rounded-lg"}
            >
              <Icon className="h-6 w-6" weight="fill" />
            </ToolbarButton>
          );
        })}
      </ToolbarGroup>
      <ToolbarSeparator className={"hidden md:flex bg-white/20"} />
      <ToolbarButton className={"hidden md:flex min-w-24 justify-center"}>
        <SavingStatusSection />
      </ToolbarButton>
    </Toolbar>
  );
}
