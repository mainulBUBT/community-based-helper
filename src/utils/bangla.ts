const DIGITS = "০১২৩৪৫৬৭৮৯";

export const toBnDigits = (value: string | number) => String(value).replace(/\d/g, (d) => DIGITS[Number(d)]);

export const WEEKDAYS = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
