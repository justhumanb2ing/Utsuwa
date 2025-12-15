"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { LoaderIcon } from "lucide-react";
import Logo from "../layout/logo";
import LogoTitle from "../layout/logo-title";

export default function SignInSection() {
  return (
    <div className="grid w-full grow items-center bg-background px-4 sm:justify-center">
      <SignIn.Root>
        <Clerk.Loading>
          {(isGlobalLoading) => (
            <>
              <SignIn.Step
                name="start"
                className="w-full space-y-4 rounded-2xl px-4 py-10 sm:w-96 sm:px-8"
              >
                <header className="text-center mb-6 flex justify-center items-center">
                  <Logo />
                  <LogoTitle />
                </header>
                <Clerk.GlobalError className="block text-sm text-red-600" />
                <Clerk.Field name="identifier">
                  <Clerk.Label className="sr-only">Email</Clerk.Label>
                  <Clerk.Input
                    type="email"
                    required
                    placeholder="your-email@email.com"
                    autoComplete="off"
                    className={cn(
                      "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                      "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                      "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                      "bg-muted shadow-none h-12 rounded-xl",
                      "data-invalid:border-destructive data-invalid:text-destructive"
                    )}
                  />
                  <Clerk.FieldError className="mt-2 block text-xs text-red-600" />
                </Clerk.Field>

                <SignIn.Action submit asChild>
                  <Button
                    disabled={isGlobalLoading}
                    className={cn(
                      "w-full rounded-xl bg-brand-indigo",
                      "hover:bg-brand-indigo-hover"
                    )}
                    size={"lg"}
                  >
                    <Clerk.Loading>
                      {(isLoading) => {
                        return isLoading ? (
                          <LoaderIcon className="size-4 animate-spin" />
                        ) : (
                          "Continue"
                        );
                      }}
                    </Clerk.Loading>
                  </Button>
                </SignIn.Action>

                <div className="relative flex items-center py-2">
                  <div className="grow border-t border-gray-100" />
                  <span className="mx-4 shrink-0 text-xs font-medium text-gray-400">
                    OR
                  </span>
                  <div className="grow border-t border-gray-100" />
                </div>

                <div className="space-y-2">
                  <Clerk.Connection name="google" asChild>
                    <Button
                      type="button"
                      variant={"outline"}
                      size={"icon-lg"}
                      className="w-full rounded-xl h-12 bg-background shadow hover:bg-accent/50"
                      disabled={isGlobalLoading}
                    >
                      <Clerk.Loading scope="provider:google">
                        {(isLoading) =>
                          isLoading ? (
                            <LoaderIcon className="size-4 animate-spin" />
                          ) : (
                            <>
                              <Clerk.Icon />
                              Sign in with Google
                            </>
                          )
                        }
                      </Clerk.Loading>
                    </Button>
                  </Clerk.Connection>
                </div>

                <Button
                  variant="link"
                  size="sm"
                  className="w-full text-neutral-700"
                >
                  <Clerk.Link navigate="sign-up">
                    Don&apos;t have an account? Sign up
                  </Clerk.Link>
                </Button>
              </SignIn.Step>

              <SignIn.Step
                name="verifications"
                className="w-full space-y-6 rounded-2xl px-4 py-10 sm:w-96 sm:px-8"
              >
                <SignIn.Strategy name="email_code">
                  <header className="text-center flex flex-col items-center">
                    <Logo />
                    <h1 className="mt-4 text-xl font-medium tracking-tight text-neutral-950">
                      Verify email code
                    </h1>
                  </header>
                  <Clerk.GlobalError className="block text-sm text-red-600" />
                  <Clerk.Field
                    name="code"
                    className="flex flex-col justify-center"
                  >
                    <Clerk.Label className="sr-only">
                      Email verification code
                    </Clerk.Label>
                    <Clerk.Input
                      type="otp"
                      className="flex justify-center has-disabled:opacity-50"
                      autoSubmit
                      render={({ value, status }) => {
                        return (
                          <div
                            data-status={status}
                            className={cn(
                              "relative flex size-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
                              {
                                "z-10 ring-2 ring-ring ring-offset-background":
                                  status === "cursor" || status === "selected",
                              }
                            )}
                          >
                            {value}
                            {status === "cursor" && (
                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <div className="animate-caret-blink h-4 w-px bg-foreground duration-1000" />
                              </div>
                            )}
                          </div>
                        );
                      }}
                    />
                    <Clerk.FieldError className="block text-sm text-destructive text-center" />
                    <SignIn.Action
                      asChild
                      resend
                      className="text-muted-foreground text-center w-full"
                      fallback={({ resendableAfter }) => (
                        <Button
                          variant="link"
                          size="sm"
                          disabled
                          className="text-center w-full"
                        >
                          Didn&apos;t receive a code? Resend
                          <span className="tabular-nums">
                            ({resendableAfter}s)
                          </span>
                        </Button>
                      )}
                    >
                      <Button variant="link" size="sm">
                        Didn&apos;t receive a code? Resend
                      </Button>
                    </SignIn.Action>
                  </Clerk.Field>

                  <SignIn.Action submit asChild>
                    <Button
                      disabled={isGlobalLoading}
                      className={cn(
                        "w-full mt-4 rounded-xl bg-brand-indigo",
                        "hover:bg-brand-indigo-hover"
                      )}
                      size={"lg"}
                    >
                      <Clerk.Loading>
                        {(isLoading) => {
                          return isLoading ? (
                            <LoaderIcon className="size-4 animate-spin" />
                          ) : (
                            "Continue"
                          );
                        }}
                      </Clerk.Loading>
                    </Button>
                  </SignIn.Action>
                </SignIn.Strategy>
              </SignIn.Step>
            </>
          )}
        </Clerk.Loading>
      </SignIn.Root>
    </div>
  );
}
