export class StoreBlocked extends Error {
  constructor(readonly host: string, reason: string) {
    super(`${host}: ${reason}`);
  }
}

export class NotFound extends Error {}

// পাতা খোলে, কিন্তু দোকান নিজেই দাম দেখায় না ("To be announced"): না-পাওয়ার মতোই, দাম "স্টকে নেই" হয়
export class NoPrice extends NotFound {}

export class Disallowed extends Error {}

export function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
