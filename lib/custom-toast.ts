// ui/toast/toast-manager.ts

import { toastManager } from "@/components/ui/toast";

export const CustomToast = {
  loading: (message: string) => {
    const id = toastManager.add({
      title: message,
      type: "loading",
    });
    return id;
  },

  success: (id: string, message: string) => {
    toastManager.update(id, {
      title: message,
      type: "success",
    });
  },

  error: (id: string, message: string) => {
    toastManager.update(id, {
      title: message,
      type: "error",
    });
  },

  close: (id: string) => {
    toastManager.close(id);
  },

  // Loading + auto resolve pattern
  async promise<T>(
    fn: () => Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ): Promise<T> {
    const id = CustomToast.loading(messages.loading);
    try {
      const result = await fn();
      CustomToast.success(id, messages.success);
      return result;
    } catch (err) {
      CustomToast.error(id, messages.error);
      throw err;
    }
  },
};
