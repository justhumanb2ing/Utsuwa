interface MutationMeta extends Record<string, unknown> {
  shouldShowToast?: boolean;
  toastKey?: string;
}

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: MutationMeta;
  }
}

export {};
