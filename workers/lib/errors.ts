export class StoreBlocked extends Error {
  constructor(readonly host: string, reason: string) {
    super(`${host}: ${reason}`);
  }
}

export class NotFound extends Error {}

export class Disallowed extends Error {}

export function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
