import { siteConfig } from "@/config/metadata-config";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function Logo({
  className,
}: {
  className?: React.HTMLAttributes<HTMLDivElement>["className"];
}) {
  return (
    <div className={cn("size-14", className)}>
      <Image
        src={"/logo.png"}
        alt={siteConfig.title}
        width={300}
        height={300}
        className="object-cover w-full h-full scale-150"
      />
    </div>
  );
}
