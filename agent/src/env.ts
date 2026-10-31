// wrangler secret put দিয়ে বসানো; wrangler.jsonc এ থাকে না, তাই generated Env এ নেই
export interface ManagerEnv extends Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}
