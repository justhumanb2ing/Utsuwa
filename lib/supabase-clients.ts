import { createBrowserClient, createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient as SupabaseClientBase } from "@supabase/supabase-js";
import { cookies } from "next/headers";

type SupabaseClient = SupabaseClientBase<unknown>;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const assertEnv = (value: string | undefined, key: string): string => {
  if (!value) {
    throw new Error(`Supabase 설정: ${key} 값이 설정되지 않았습니다. .env 파일을 확인하세요.`);
  }
  return value;
};

const resolveServerKey = (): string => {
  if (supabaseServiceRoleKey) {
    return supabaseServiceRoleKey;
  }

  return assertEnv(supabaseAnonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
};

/**
 * 브라우저(Client Component)에서 사용할 Supabase 클라이언트를 생성한다.
 * 인증 세션은 Supabase 기본 쿠키 관리 방식을 사용하며, 브라우저 바운더리 밖(서버)에서 호출하지 않는다.
 */
export const createSupabaseBrowserClient = (): SupabaseClient => {
  const url = assertEnv(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL");
  const key = assertEnv(supabaseAnonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createBrowserClient<unknown>(url, key);
};

/**
 * 서버 컴포넌트, Route Handler, 서버 액션에서 사용할 Supabase 클라이언트를 생성한다.
 * 서비스 롤 키가 주어지면 서버 전용 로직에 사용하고, 없으면 익명 키로 동작한다.
 */
export const createSupabaseServerClient = (): SupabaseClient => {
  const cookieStore = cookies();
  const url = assertEnv(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL");
  const key = resolveServerKey();

  return createServerClient<unknown>(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });
};
