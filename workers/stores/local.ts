// GitHub এর সার্ভার যেসব দোকানের robots.txt বা পাতায় 403 পায় (১১-০৪ এর prices আর discover run), কিন্তু ঘরের IP থেকে সৎ DordamBot পরিচয়েই খোলে।
// এগুলো `local_prices` জবে ম্যাক/PC/ফোনের রানার থেকে পড়া হয়। Chaldal বাদ: ঘরের IP থেকেও সংযোগ হয় না।
export const LOCAL_HOSTS = [
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
];
