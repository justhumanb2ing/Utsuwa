"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useHandleChangeForm } from "@/hooks/use-handle-change-form";

type HandleChangeFormProps = {
  pageId: string;
  ownerId: string;
  handle: string;
  isOwner: boolean;
};

export const HandleChangeForm = ({
  pageId,
  ownerId,
  handle,
  isOwner,
}: HandleChangeFormProps) => {
  const { form, onSubmit, isPending } = useHandleChangeForm({
    pageId,
    ownerId,
    handle,
  });

  if (!isOwner) return null;

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit(onSubmit)();
        }}
        className="space-y-2"
      >
        <input type="hidden" {...form.register("pageId")} />
        <input type="hidden" {...form.register("ownerId")} />

        <FormField
          control={form.control}
          name="handle"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <div className="px-3 py-2 rounded-md bg-zinc-100 text-zinc-500">
                  @
                </div>
                <FormControl>
                  <Input
                    {...field}
                    className="w-full"
                    placeholder="예: myspace123"
                    readOnly={isPending}
                  />
                </FormControl>
                <Button type="submit" disabled={isPending}>
                  핸들 변경
                </Button>
              </div>
              <p className="text-xs text-zinc-500">
                3~20자의 영문 소문자와 숫자만 입력하세요.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};
