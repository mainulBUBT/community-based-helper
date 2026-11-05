import { execFile } from "node:child_process";
import { tmpdir } from "node:os";

const TIMEOUT_MS = 120_000;

export const localAiCommand = () => process.env.LOCAL_AI_COMMAND?.trim() ?? "";

// মালিকের নিজের AI CLI (Claude, Codex বা অন্য যেকোনো), শুধু লোকাল জবে। প্রশ্ন যায় stdin এ, উত্তর আসে stdout এ।
// দোকানের লেখা এতে ঢোকে, তাই repo-র বাইরে চলে আর service key পায় না; টুল বন্ধ রাখা command এর দায়িত্ব (docs/local-runner.md)
function run(prompt: string): Promise<string> {
  const { HOME, PATH, USER, LANG, NODE_ENV } = process.env;
  return new Promise((resolve, reject) => {
    const child = execFile(
      "/bin/sh",
      ["-c", localAiCommand()],
      { cwd: tmpdir(), env: { HOME, PATH, USER, LANG, NODE_ENV }, timeout: TIMEOUT_MS },
      (error, stdout) => (error ? reject(error) : resolve(stdout)),
    );
    child.stdin?.end(prompt);
  });
}

let queue: Promise<unknown> = Promise.resolve();

export function askLocalAi(system: string, user: string): Promise<string> {
  const turn = queue.then(() => run(`${system}\n\n${user}`));
  queue = turn.catch(() => {});
  return turn;
}
