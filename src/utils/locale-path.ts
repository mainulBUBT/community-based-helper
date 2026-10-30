export const toEnPath = (path: string) => `/en${path === "/" ? "/" : path}`;

export const toBnPath = (path: string) => path.replace(/^\/en(?=\/|$)/, "") || "/";

// এই পথগুলোর দুই ভাষাতেই পেজ আছে; বাকিগুলোতে (404, অফলাইন) ভাষা বদলালে হোমে যায়
const TWINNED = /^\/(?:$|about\/|search\/|sellers\/|saved\/|privacy\/|terms\/|faq\/|contact\/|product\/[^/]+\/|seller\/[^/]+\/|category\/[^/]+\/|brand\/[^/]+\/)$/;

const withSlash = (path: string) => (path.endsWith("/") ? path : `${path}/`);

export const otherLanguagePath = (path: string, toEn: boolean) => {
  const bnPath = withSlash(toBnPath(path));
  if (!TWINNED.test(bnPath)) return toEn ? "/en/" : "/";
  return toEn ? toEnPath(bnPath) : bnPath;
};
