const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const hasBackend = Boolean(url && key);

// পাবলিক পেজ Supabase এ লেখে সরাসরি fetch দিয়ে; supabase-js (~৩০০ KB) শুধু অ্যাডমিনে লাগে
export function supabaseFetch(path: string, init: RequestInit) {
  return fetch(`${url}${path}`, { ...init, headers: { apikey: key ?? "", "content-type": "application/json", ...init.headers } });
}
