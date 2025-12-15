"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignUp from "@clerk/elements/sign-up";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { LoaderIcon } from "lucide-react";
import Link from "next/link";
import Logo from "../layout/logo";
import LogoTitle from "../layout/logo-title";

export default function SignUpSection() {
  return (
    <SignUp.Root>
      <Clerk.Loading>
        {(isGlobalLoading) => (
          <>
            <SignUp.Step
              name="start"
              className="w-full space-y-4 rounded-2xl px-4 py-10 sm:w-96 sm:px-8"
            >
              {/* Logo */}
              <header className="text-left flex justify-center">
                <Logo />
                <LogoTitle />
              </header>

              <Clerk.GlobalError className="block text-sm text-red-600" />

              <Clerk.Field
                name="username"
                className="text-sm flex flex-col gap-2"
              >
                <Clerk.Label className="sr-only">Username</Clerk.Label>
                <Clerk.Input
                  type="text"
                  required
                  placeholder="Username"
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

              <Clerk.Field
                name="emailAddress"
                className="text-sm flex flex-col gap-2"
              >
                <Clerk.Label className="sr-only">Email</Clerk.Label>
                <Clerk.Input
                  type="email"
                  required
                  placeholder="Email"
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

              <Clerk.Field
                name="password"
                className="text-sm flex flex-col gap-2"
              >
                <Clerk.Label className="sr-only">Password</Clerk.Label>
                <Clerk.Input
                  type="password"
                  required
                  placeholder="Password"
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

              <SignUp.Captcha />

              <SignUp.Action submit asChild>
                <Button
                  disabled={isGlobalLoading}
                  className={cn(
                    "w-full rounded-xl bg-brand-poppy",
                    "hover:bg-brand-poppy-hover"
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
              </SignUp.Action>

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
                    className="w-full shadow-none rounded-xl h-12"
                    disabled={isGlobalLoading}
                  >
                    <Clerk.Loading scope="provider:google">
                      {(isLoading) =>
                        isLoading ? (
                          <LoaderIcon className="size-4 animate-spin" />
                        ) : (
                          <>
                            <Clerk.Icon />
                            Sign up with Google
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
                <Clerk.Link navigate="sign-in">
                  Already have an account? Sign in
                </Clerk.Link>
              </Button>

              <footer className="text-xs text-neutral-400 text-center mt-12">
                By clicking “Continue with Google/Email” above, you acknowledge
                that you have read and understood, and agree to our{" "}
                <Link href={"#"} className="underline underline-offset-1">
                  Terms & Conditions
                </Link>{" "}
                and{" "}
                <Link href={"#"} className="underline underline-offset-1">
                  Privacy Policy
                </Link>
                .
              </footer>
            </SignUp.Step>

            <SignUp.Step
              name="continue"
              className="w-full space-y-2 rounded-2xl px-4 py-10 sm:w-96 sm:px-8"
            >
              <h1 className="my-8 text-xl font-medium tracking-tight text-neutral-950">
                Complete your profile.
              </h1>

              <Clerk.Field
                name="username"
                className="text-sm flex flex-col gap-2"
              >
                <Clerk.Label className="sr-only">Username</Clerk.Label>
                <Clerk.Input
                  type="text"
                  required
                  placeholder="Username"
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

              <SignUp.Action submit asChild>
                <Button
                  disabled={isGlobalLoading}
                  className="w-full rounded-xl"
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
              </SignUp.Action>
            </SignUp.Step>

            <SignUp.Step
              name="verifications"
              className="w-full space-y-6 rounded-2xl px-4 py-10 sm:w-96 sm:px-8"
            >
              <SignUp.Strategy name="email_code">
                <header className="text-center flex flex-col items-center">
                  <Logo />
                  <h1 className="mt-4 text-xl font-medium tracking-tight text-neutral-950">
                    Verify your email
                  </h1>
                  <h2 className="text-muted-foreground text-sm">
                    Use the verification code sent to your email address
                  </h2>
                </header>

                <Clerk.GlobalError className="block text-sm text-red-600" />

                <Clerk.Field
                  name="code"
                  className="flex flex-col justify-center"
                >
                  <Clerk.Label className="sr-only">Email code</Clerk.Label>
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
                  <Clerk.FieldError className="mt-2 block text-xs text-red-600 mx-auto" />
                </Clerk.Field>

                <SignUp.Action
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
                      <span className="tabular-nums">({resendableAfter}s)</span>
                    </Button>
                  )}
                >
                  <Button type="button" variant="link" size="sm">
                    Didn&apos;t receive a code? Resend
                  </Button>
                </SignUp.Action>

                <div className="grid w-full gap-y-4">
                  <SignUp.Action submit asChild>
                    <Button
                      disabled={isGlobalLoading}
                      className={cn(
                        "w-full rounded-xl bg-brand-poppy",
                        "hover:bg-brand-poppy-hover"
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
                  </SignUp.Action>
                </div>
              </SignUp.Strategy>
            </SignUp.Step>
          </>
        )}
      </Clerk.Loading>
    </SignUp.Root>
  );
}
