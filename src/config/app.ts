export const APP = {
  name: "পথঘাট",
  tagline: "জরুরি আর দরকারি জায়গা — কমিউনিটি যাচাই করা",
  emergencyNumber: "999",
  timeZone: "Asia/Dhaka",
  staleAfterDays: 90,
  nearbyRadiusKm: 3,
  defaultLocation: { lat: 23.7473, lng: 90.3753, label: "ধানমন্ডি ২৭" },
  map: {
    tileUrl: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> অবদানকারীগণ',
    zoom: 14,
  },
} as const;
