// GitHub এর সার্ভার যেসব দোকানের robots.txt বা পাতায় 403 পায় (১১-০৪ এর prices আর discover run), কিন্তু ঘরের IP থেকে সৎ DordamBot পরিচয়েই খোলে।
// এগুলো শুধু `local_prices` আর `local_discover` জবে ম্যাক/PC/ফোনের রানার থেকে পড়া হয়; GitHub এর prices আর discover এদের ছোঁয় না। Chaldal বাদ: ঘরের IP থেকেও সংযোগ হয় না।
const LOCAL_HOSTS = [
  "sumashtech.com",
  "kryinternational.com",
  "mobilebuzzbd.com",
  "gadgetandgear.com",
  "gadgetbreeze.com.bd",
  "pcbstore.com.bd",
  "techmarvels.com.bd",
  "rokomari.com",
  "banglashoppers.com",
  "binarylogic.com.bd",
  "beprincessbd.com",
  "liraimportltd.com",
  "emartwayskincare.com.bd",
  "kcarebd.com",
  "haramainstore.com",
  "computervillage.com.bd",
  "pchouse.com.bd",
  "themallbd.com",
  // ১৬ নভেম্বর: এদের দাম GitHub এর Jina দিয়েও আসছিল না (GitHub এ robots.txt/পাতায় 403, "বন্ধ" তালিকায়), ঘরের IP থেকেই পড়া যায়
  "umrelo.com.bd",
  "electronicsbangladesh.com",
  "salextra.com.bd",
  "skyland.com.bd",
  "smartdeal.com.bd",
  "glowellabd.com",
];

// GitHub এর IP তে 403, তবে দাম Jina দিয়ে GitHub থেকেই আসে; শুধু নতুন পণ্য খোঁজা (পুরো তালিকা) ঘরের IP থেকে
const LOCAL_DISCOVER_HOSTS = ["onixbd.com"];

const host = (url: string) => new URL(url).host.replace(/^www\./, "");

export const isLocalUrl = (url: string) => LOCAL_HOSTS.includes(host(url));

export const discoversLocally = (url: string) => isLocalUrl(url) || LOCAL_DISCOVER_HOSTS.includes(host(url));
