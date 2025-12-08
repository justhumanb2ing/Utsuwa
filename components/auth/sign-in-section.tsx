"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { LoaderIcon } from "lucide-react";

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
                <header className="text-center mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 40 40"
                    className="mx-auto size-10"
                  >
                    <mask
                      id="a"
                      width="40"
                      height="40"
                      x="0"
                      y="0"
                      maskUnits="userSpaceOnUse"
                    >
                      <circle cx="20" cy="20" r="20" fill="#D9D9D9" />
                    </mask>
                    <g fill="#0A0A0A" mask="url(#a)">
                      <path d="M43.5 3a.5.5 0 0 0 0-1v1Zm0-1h-46v1h46V2ZM43.5 8a.5.5 0 0 0 0-1v1Zm0-1h-46v1h46V7ZM43.5 13a.5.5 0 0 0 0-1v1Zm0-1h-46v1h46v-1ZM43.5 18a.5.5 0 0 0 0-1v1Zm0-1h-46v1h46v-1ZM43.5 23a.5.5 0 0 0 0-1v1Zm0-1h-46v1h46v-1ZM43.5 28a.5.5 0 0 0 0-1v1Zm0-1h-46v1h46v-1ZM43.5 33a.5.5 0 0 0 0-1v1Zm0-1h-46v1h46v-1ZM43.5 38a.5.5 0 0 0 0-1v1Zm0-1h-46v1h46v-1Z" />
                      <path d="M27 3.5a1 1 0 1 0 0-2v2Zm0-2h-46v2h46v-2ZM25 8.5a1 1 0 1 0 0-2v2Zm0-2h-46v2h46v-2ZM23 13.5a1 1 0 1 0 0-2v2Zm0-2h-46v2h46v-2ZM21.5 18.5a1 1 0 1 0 0-2v2Zm0-2h-46v2h46v-2ZM20.5 23.5a1 1 0 1 0 0-2v2Zm0-2h-46v2h46v-2ZM22.5 28.5a1 1 0 1 0 0-2v2Zm0-2h-46v2h46v-2ZM25 33.5a1 1 0 1 0 0-2v2Zm0-2h-46v2h46v-2ZM27 38.5a1 1 0 1 0 0-2v2Zm0-2h-46v2h46v-2Z" />
                    </g>
                  </svg>
                  <h1 className="mt-4 text-xl font-medium tracking-tight text-neutral-950">
                    Sign in to Clover
                  </h1>
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
                </SignIn.Action>

                <div className="relative flex items-center py-2">
                  <div className="grow border-t border-gray-100" />
                  <span className="mx-4 shrink-0 text-xs font-medium text-gray-400">
                    OR
                  </span>
                  <div className="grow border-t border-gray-100" />
                </div>

                <div>
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
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                  <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                  />
                                  <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                  />
                                  <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                  />
                                  <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                  />
                                </svg>
                                Sign in with Google
                              </>
                            )
                          }
                        </Clerk.Loading>
                      </Button>
                    </Clerk.Connection>
                  </div>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  asChild
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
                  <header className="text-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 40 40"
                      className="mx-auto size-10"
                    >
                      <mask
                        id="a"
                        width="40"
                        height="40"
                        x="0"
                        y="0"
                        maskUnits="userSpaceOnUse"
                      >
                        <circle cx="20" cy="20" r="20" fill="#D9D9D9" />
                      </mask>
                      <g fill="#0A0A0A" mask="url(#a)">
                        <path d="M43.5 3a.5.5 0 0 0 0-1v1Zm0-1h-46v1h46V2ZM43.5 8a.5.5 0 0 0 0-1v1Zm0-1h-46v1h46V7ZM43.5 13a.5.5 0 0 0 0-1v1Zm0-1h-46v1h46v-1ZM43.5 18a.5.5 0 0 0 0-1v1Zm0-1h-46v1h46v-1ZM43.5 23a.5.5 0 0 0 0-1v1Zm0-1h-46v1h46v-1ZM43.5 28a.5.5 0 0 0 0-1v1Zm0-1h-46v1h46v-1ZM43.5 33a.5.5 0 0 0 0-1v1Zm0-1h-46v1h46v-1ZM43.5 38a.5.5 0 0 0 0-1v1Zm0-1h-46v1h46v-1Z" />
                        <path d="M27 3.5a1 1 0 1 0 0-2v2Zm0-2h-46v2h46v-2ZM25 8.5a1 1 0 1 0 0-2v2Zm0-2h-46v2h46v-2ZM23 13.5a1 1 0 1 0 0-2v2Zm0-2h-46v2h46v-2ZM21.5 18.5a1 1 0 1 0 0-2v2Zm0-2h-46v2h46v-2ZM20.5 23.5a1 1 0 1 0 0-2v2Zm0-2h-46v2h46v-2ZM22.5 28.5a1 1 0 1 0 0-2v2Zm0-2h-46v2h46v-2ZM25 33.5a1 1 0 1 0 0-2v2Zm0-2h-46v2h46v-2ZM27 38.5a1 1 0 1 0 0-2v2Zm0-2h-46v2h46v-2Z" />
                      </g>
                    </svg>
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
                      className="text-muted-foreground"
                      fallback={({ resendableAfter }) => (
                        <Button variant="link" size="sm" disabled>
                          Didn&apos;t receive a code? Resend (
                          <span className="tabular-nums">
                            {resendableAfter}
                          </span>
                          )
                        </Button>
                      )}
                    >
                      <Button variant="link" size="sm">
                        Didn&apos;t receive a code? Resend
                      </Button>
                    </SignIn.Action>
                  </Clerk.Field>

                  <SignIn.Action submit asChild>
                    <Button disabled={isGlobalLoading} className="w-full mt-4">
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
