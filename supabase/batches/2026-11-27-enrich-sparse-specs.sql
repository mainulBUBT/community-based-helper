-- ২০২৬-১১-২৭: যে ৬০টা পণ্যে স্পেক কম (≤২টি আইটেম) বা শুধু এক লাইনে গাদাগাদি (Pureit), সেগুলোর স্পেক ও সংক্ষিপ্ত বাংলা/ইংরেজি বিবরণ সমৃদ্ধ করা।
begin;

-- Baby Care (12)
update products set
  specs = '[{"group":"Details","items":[{"label":"Active Ingredients","value":"Zinc Oxide (15.25%), Hypoallergenic Anhydrous Lanolin (4%), Benzyl Alcohol (0.39%)"},{"label":"Use","value":"Soothes sore skin and treats nappy rash; also for cuts, grazes and minor burns"},{"label":"Form","value":"Water-repellent protective barrier cream"},{"label":"Suitable For","value":"Babies and adults (sensitive skin)"}]}]'::jsonb,
  description = coalesce(description, 'শিশুর ডায়াপার র‍্যাশ, লালচে ভাব ও হালকা কাটা-ছেঁড়ায় সুরক্ষা দেয়। জিংক অক্সাইড ও ল্যানোলিনযুক্ত পানিরোধী বেজ ত্বকে সুরক্ষা স্তর তৈরি করে।'),
  description_en = coalesce(description_en, 'Antiseptic healing barrier cream with 15.25% zinc oxide and lanolin to soothe nappy rash, minor cuts, and chafed skin.')
where slug = 'sudocrem-antiseptic-healing-cream';

update products set
  specs = '[{"group":"Details","items":[{"label":"Key Ingredients","value":"Olive Oil, Almond Oil, Vitamin E"},{"label":"Use","value":"Everyday baby massage oil that locks in moisture"},{"label":"Free From","value":"Parabens, mineral oil, synthetic dyes"},{"label":"Origin","value":"Bangladesh (Marico)"}]}]'::jsonb,
  description = coalesce(description, 'অলিভ অয়েল, আমন্ড অয়েল ও ভিটামিন ই সমৃদ্ধ দৈনন্দিন বেবি ম্যাসাজ অয়েল। শিশুর কোমল ত্বকে আর্দ্রতা ধরে রাখে।'),
  description_en = coalesce(description_en, 'Lightweight daily baby massage oil enriched with olive oil, almond oil, and Vitamin E to nourish and lock in moisture.')
where slug = 'parachute-just-for-baby-oil';

update products set
  specs = '[{"group":"Details","items":[{"label":"Key Ingredients","value":"Glycerin, Coconut Oil"},{"label":"Use","value":"24-hour moisture lock cream for delicate baby skin"},{"label":"Free From","value":"Parabens, phthalates, dyes"},{"label":"Safety","value":"Pediatrician and dermatologist tested; pH balanced"}]}]'::jsonb,
  description = coalesce(description, 'শিশুর নরম ত্বকে ২৪ ঘণ্টা পর্যন্ত আর্দ্রতা ধরে রাখে। প্যারাবেন, থ্যালেট ও কৃত্রিম রংমুক্ত, চর্মরোগ বিশেষজ্ঞ দ্বারা পরীক্ষিত।'),
  description_en = coalesce(description_en, 'Gentle baby cream formulated to lock in moisture for 24 hours; free from parabens, phthalates, and dyes.')
where slug = 'johnsons-baby-cream';

update products set
  specs = '[{"group":"Details","items":[{"label":"Use","value":"Lightweight daily lotion that moisturizes and softens baby skin"},{"label":"Texture","value":"Quick-absorbing, non-greasy"},{"label":"Origin","value":"Bangladesh (Square Toiletries)"}]}]'::jsonb,
  description = coalesce(description, 'শিশুর কোমল ত্বক মসৃণ ও আর্দ্র রাখার জন্য হালকা বেবি লোশন। দ্রুত ত্বকে মিশে যায়, চিটচিটে ভাব থাকে না।'),
  description_en = coalesce(description_en, 'Lightweight, fast-absorbing baby lotion formulated to keep delicate skin soft and moisturized without greasiness.')
where slug = 'meril-baby-lotion';

update products set
  specs = '[{"group":"Details","items":[{"label":"Use","value":"Light, low-alkali shampoo for baby hair and scalp"},{"label":"Formula","value":"Mild, no-tears gentle cleansing"},{"label":"Origin","value":"Bangladesh (Square Toiletries)"}]}]'::jsonb,
  description = coalesce(description, 'শিশুর চুল ও মাথার ত্বকের জন্য কম ক্ষারযুক্ত মৃদু বেবি শ্যাম্পু। চোখে জ্বালাপোড়া না করেই পরিষ্কার করে।'),
  description_en = coalesce(description_en, 'Mild, low-alkali no-tears baby shampoo designed to gently cleanse delicate hair and scalp.')
where slug = 'meril-baby-shampoo';

update products set
  specs = '[{"group":"Details","items":[{"label":"Use","value":"Triple-action powder against rash, irritation and prickly heat"},{"label":"Benefit","value":"Absorbs excess moisture and prevents chafing"},{"label":"Origin","value":"Bangladesh (Square Toiletries)"}]}]'::jsonb,
  description = coalesce(description, 'র‍্যাশ, ত্বকের জ্বালাপোড়া ও ঘামাচি প্রতিরোধে সাহায্য করে। অতিরিক্ত ঘাম ও আর্দ্রতা শুষে ত্বক শুষ্ক ও আরামদায়ক রাখে।'),
  description_en = coalesce(description_en, 'Triple-action baby powder that absorbs excess moisture to help prevent nappy rash, chafing, and prickly heat.')
where slug = 'meril-baby-powder';

update products set
  specs = '[{"group":"Details","items":[{"label":"Key Ingredients","value":"Sterilized Talc, Almond Oil, Neem Extract, Vitamin E"},{"label":"Use","value":"Protects from excess moisture and keeps skin dry"},{"label":"Safety","value":"Allergy tested; free from parabens and dyes"},{"label":"Origin","value":"Bangladesh (Marico)"}]}]'::jsonb,
  description = coalesce(description, 'স্টেরিলাইজড ট্যাল্ক, আমন্ড অয়েল, নিম ও ভিটামিন ই সমৃদ্ধ বেবি পাউডার। অতিরিক্ত আর্দ্রতা শোষণ করে ত্বক সুরক্ষিত রাখে।'),
  description_en = coalesce(description_en, 'Allergy-tested baby powder with sterilized talc, almond oil, neem extract, and Vitamin E to protect against moisture.')
where slug = 'parachute-just-for-baby-powder';

update products set
  specs = '[{"group":"Details","items":[{"label":"Use","value":"No-tears head-to-toe body and hair wash"},{"label":"Safety","value":"Allergy tested, pH balanced"},{"label":"Free From","value":"Parabens, sulfates, synthetic dyes"},{"label":"Origin","value":"Bangladesh (Marico)"}]}]'::jsonb,
  description = coalesce(description, 'চুল ও শরীর দুইয়ের জন্যই উপযোগী নো-টিয়ার্স বেবি ওয়াশ। পিএইচ ব্যালেন্সড ও অ্যালার্জি পরীক্ষিত।'),
  description_en = coalesce(description_en, 'pH-balanced, allergy-tested no-tears head-to-toe baby wash free from parabens and sulfates.')
where slug = 'parachute-just-for-baby-wash';

update products set
  specs = '[{"group":"Details","items":[{"label":"Use","value":"Anti-rash moisturizing baby lotion"},{"label":"Key Ingredients","value":"Allantoin, Vitamin E"},{"label":"Suitable For","value":"Baby skin prone to rash and irritation"},{"label":"Safety","value":"pH balanced, dermatologically tested"}]}]'::jsonb,
  description = coalesce(description, 'র‍্যাশ ও সংবেদনশীল ত্বকের জন্য উপযোগী ময়েশ্চারাইজিং বেবি লোশন। ত্বকের জ্বালাপোড়া কমিয়ে নরম রাখে।'),
  description_en = coalesce(description_en, 'pH-balanced anti-rash moisturizing lotion formulated for sensitive baby skin prone to irritation.')
where slug = 'kodomo-anti-rash-moisturizing-baby-lotion';

update products set
  specs = '[{"group":"Details","items":[{"label":"Key Ingredients","value":"Milk Lotion, Honey, Probiotics"},{"label":"Use","value":"Gentle daily bath soap bar, 5 times milder than regular soap"},{"label":"Origin","value":"Bangladesh (Square Toiletries)"}]}]'::jsonb,
  description = coalesce(description, 'মিল্ক লোশন ও মধুসমৃদ্ধ কোমল বেবি সোপ বার। সাধারণ সাবানের চেয়ে ৫ গুণ বেশি মৃদু, গোসলের পর ত্বক শুষ্ক করে না।'),
  description_en = coalesce(description_en, 'Mild baby soap bar enriched with milk lotion and honey, formulated to be 5 times gentler than regular soap.')
where slug = 'meril-baby-cream-soap-bar';

update products set
  specs = '[{"group":"Details","items":[{"label":"Key Ingredients","value":"Olive Oil (Vitamin E), Almond Oil, Licorice"},{"label":"Use","value":"Moisturizes, protects and softens skin; prevents chafing"},{"label":"Free From","value":"Parabens, mineral oil, synthetic colors"},{"label":"Safety","value":"Clinically tested, hypoallergenic"}]}]'::jsonb,
  description = coalesce(description, 'অলিভ অয়েল, আমন্ড অয়েল ও লিকোরিস সমৃদ্ধ হাইপোঅ্যালার্জেনিক বেবি লোশন। শিশুর শুষ্ক ত্বক কোমল ও সুরক্ষিত রাখে।'),
  description_en = coalesce(description_en, 'Hypoallergenic baby lotion with olive oil, almond oil, and licorice to nourish, soften, and protect sensitive skin.')
where slug = 'himalaya-baby-lotion';

update products set
  specs = '[{"group":"Details","items":[{"label":"Key Ingredients","value":"Aloe Vera, Chamomile Extract"},{"label":"Use","value":"Soft, mild wet wipes for diaper changes, hands and face"},{"label":"Free From","value":"Alcohol, parabens, silicones"},{"label":"Safety","value":"pH balanced, hypoallergenic, dermatologically tested"}]}]'::jsonb,
  description = coalesce(description, 'অ্যালকোহল ও প্যারাবেনমুক্ত নরম বেবি ওয়াইপস। অ্যালোভেরা ও ক্যামোমাইল সমৃদ্ধ হওয়ায় ডায়াপার বদলানো, হাত ও মুখ মোছার জন্য নিরাপদ।'),
  description_en = coalesce(description_en, 'Alcohol-free, pH-balanced baby wipes enriched with aloe vera and chamomile extract for gentle cleansing.')
where slug = 'neocare-baby-wipes';

-- Diapers (2)
update products set
  specs = '[{"group":"Details","items":[{"label":"Type","value":"Pant-style"},{"label":"Core Features","value":"Super Absorbent Polymer (SAP), Wetness Indicator, Cottony Soft Topsheet"},{"label":"Use","value":"Pull-up diaper with elastic waistband and leak-proof cuffs"},{"label":"Origin","value":"Bangladesh (ACI Limited)"}]}]'::jsonb,
  description = coalesce(description, 'চলাফেরা করা শিশুর জন্য আরামদায়ক প্যান্ট স্টাইল ডায়াপার। ওয়েটনেস ইন্ডিকেটর ও সুপার অ্যাবজরবেন্ট কোর থাকায় দীর্ঘক্ষণ শুষ্ক রাখে।'),
  description_en = coalesce(description_en, 'Pull-up pant-style baby diaper with Super Absorbent Polymer core, wetness indicator, and soft elastic waistband.')
where slug = 'savlon-twinkle-baby-pant-diaper';

update products set
  specs = '[{"group":"Details","items":[{"label":"Type","value":"Belt / Tape-style (Hook & Loop Velcro)"},{"label":"Core Features","value":"Super Absorbent Polymer (SAP), Acquisition Distribution Layer (ADL), Hydrophobic Leg Cuffs, Wetness Indicator"},{"label":"Use","value":"Adjustable belt diaper with breathable textile backsheet"},{"label":"Origin","value":"Bangladesh (Incepta)"}]}]'::jsonb,
  description = coalesce(description, 'অ্যাডজাস্টেবল ভেলক্রো বেল্ট সিস্টেম ডায়াপার। ব্রিদেবল ব্যাকশিট ও লিক-গার্ড থাকায় নবজাতক ও ছোট শিশুর জন্য বিশেষ উপযোগী।'),
  description_en = coalesce(description_en, 'Adjustable tape-style baby diaper featuring a breathable backsheet, ADL core, hydrophobic leg cuffs, and wetness indicator.')
where slug = 'neocare-premium-belt-baby-diaper';

-- Dates (6)
update products set
  specs = '[{"group":"Details","items":[{"label":"Variety","value":"Ajwa"},{"label":"Origin","value":"Al-Madinah, Saudi Arabia"},{"label":"Texture","value":"Soft, tender and slightly chewy with fine wrinkles"},{"label":"Taste","value":"Mildly sweet with fig and caramel notes"}]}]'::jsonb,
  description = coalesce(description, 'মদিনা শরিফের বিখ্যাত আজওয়া খেজুর। হালকা মিষ্টি, নরম ও গাঢ় বাদামি রঙের এই খেজুর ইফতার ও প্রতিদিনের পুষ্টির জন্য জনপ্রিয়।'),
  description_en = coalesce(description_en, 'Authentic Ajwa dates from Al-Madinah, Saudi Arabia, known for their soft chewy texture and mildly sweet, fig-like flavor.')
where slug = 'ajwa-dates';

update products set
  specs = '[{"group":"Details","items":[{"label":"Variety","value":"Sukkari"},{"label":"Origin","value":"Al-Qassim, Saudi Arabia"},{"label":"Texture","value":"Exceptionally soft and melt-in-the-mouth (golden brown)"},{"label":"Taste","value":"Richly sweet with natural caramel notes"}]}]'::jsonb,
  description = coalesce(description, 'সৌদি আরবের আল-কাসিম অঞ্চলের সোনালি রঙের সুক্কারি খেজুর। মুখে দিলেই গলে যাওয়ার মতো নরম এবং ক্যারামেলধর্মী মিষ্টি স্বাদের।'),
  description_en = coalesce(description_en, 'Golden-brown Sukkari dates from Al-Qassim, Saudi Arabia, prized for their melt-in-the-mouth softness and rich caramel sweetness.')
where slug = 'sukkari-dates';

update products set
  specs = '[{"group":"Details","items":[{"label":"Type","value":"Dry dates (Khurma / Chuara)"},{"label":"Texture","value":"Firm, sun-dried"},{"label":"Use","value":"Direct snacking, soaking in milk, desserts and payesh"}]}]'::jsonb,
  description = coalesce(description, 'শুকনো খোরমা খেজুর — দুধে ভিজিয়ে খাওয়া, পায়েস, সেমাই বা প্রতিদিনের এনার্জির জন্য উপযোগী।'),
  description_en = coalesce(description_en, 'Sun-dried Khurma dates suitable for snacking, soaking in milk, and traditional desserts.')
where slug = 'rongdhonu-premium-dry-dates-khurma';

update products set
  specs = '[{"group":"Details","items":[{"label":"Variety","value":"Safawi (Kalmi)"},{"label":"Origin","value":"Al-Madinah, Saudi Arabia"},{"label":"Texture","value":"Soft, moist, fleshy and chewy (dark brown-black)"},{"label":"Taste","value":"Richly sweet with a clean fruity finish"}]}]'::jsonb,
  description = coalesce(description, 'মদিনার কালমি (সাফাওয়ি) খেজুর। লম্বাটে ও মাংসল, নরম এবং পরিমিত মিষ্টি স্বাদের।'),
  description_en = coalesce(description_en, 'Dark, fleshy Safawi (Kalmi) dates from Al-Madinah with a soft, moist texture and rich fruity sweetness.')
where slug = 'safawi-kalmi-dates';

update products set
  specs = '[{"group":"Details","items":[{"label":"Variety","value":"Dabbas"},{"label":"Origin","value":"Al Dhafra, UAE"},{"label":"Texture","value":"Small, smooth and slightly dry"},{"label":"Taste","value":"Mildly sweet with subtle caramel notes"}]}]'::jsonb,
  description = coalesce(description, 'সংযুক্ত আরব আমিরাতের ছোট আকারের দাব্বাস খেজুর। হালকা মিষ্টি ও কম আঠালো হওয়ায় নিয়মিত খাওয়ার জন্য ভালো।'),
  description_en = coalesce(description_en, 'Small, mildly sweet Dabbas dates from the UAE with a smooth bite and subtle caramel flavor.')
where slug = 'dabbas-dates';

update products set
  specs = '[{"group":"Details","items":[{"label":"Variety","value":"Amber (Anbarah)"},{"label":"Origin","value":"Al-Madinah, Saudi Arabia"},{"label":"Texture","value":"Large, elongated, thick and fleshy"},{"label":"Taste","value":"Deep, rich traditional date sweetness"}]}]'::jsonb,
  description = coalesce(description, 'মদিনার বড় ও মাংসল অ্যাম্বার (আনবারা) খেজুর। প্রিমিয়াম মানের এই খেজুর উপহার ও ইফতারের জন্য সমাদৃত।'),
  description_en = coalesce(description_en, 'Large, elongated, thick-fleshed Amber (Anbarah) dates from Al-Madinah with a deep, rich sweetness.')
where slug = 'amber-dates';

-- Honey (18)
update products set
  specs = '[{"group":"Details","items":[{"label":"Honey Type","value":"Black seed (Kalojira) flower"},{"label":"Texture","value":"Dark amber, rich aroma"},{"label":"Storage","value":"Store in a cool, dry place; natural honey may crystallize"}]}]'::jsonb,
  description = coalesce(description, 'কালোজিরা ফুলের মধু — প্রাকৃতিক অ্যান্টিঅক্সিডেন্ট ও কালোজিরার ভেষজ গুণে সমৃদ্ধ।'),
  description_en = coalesce(description_en, 'Pure black seed (kalojira) flower honey with a dark amber color and rich herbal aroma.')
where slug = 'farmers-gold-black-seed-honey';

update products set
  specs = '[{"group":"Details","items":[{"label":"Honey Type","value":"Mustard flower"},{"label":"Origin","value":"Bangladesh"},{"label":"Note","value":"Naturally crystallizes faster in cool weather"}]}]'::jsonb,
  description = coalesce(description, 'বাংলাদেশের সরিষা ফুলের খাঁটি মধু। হালকা সোনালি রঙের এবং ঠান্ডা আবহাওয়ায় প্রাকৃতিকভাবেই জমে যায়।'),
  description_en = coalesce(description_en, 'Pure Bangladeshi mustard flower honey; light golden and naturally prone to crystallization in cool temperatures.')
where slug = 'ashol-mustard-flower-honey';

update products set
  specs = '[{"group":"Details","items":[{"label":"Honey Type","value":"Pure natural honey"},{"label":"Origin","value":"Bangladesh"},{"label":"Storage","value":"Cool, dry place away from direct sunlight"}]}]'::jsonb,
  description = coalesce(description, 'দৈনন্দিন ব্যবহার, চা, পানীয় বা খালি পেটে খাওয়ার জন্য খাঁটি প্রাকৃতিক মধু।'),
  description_en = coalesce(description_en, 'Pure natural honey suitable for daily consumption, beverages, and healthy sweetening.')
where slug = 'hosen-pure-honey';

update products set
  specs = '[{"group":"Details","items":[{"label":"Honey Type","value":"Black seed (Kalojira) flower"},{"label":"Origin","value":"Bangladesh"},{"label":"Properties","value":"Unprocessed, raw floral honey"}]}]'::jsonb,
  description = coalesce(description, 'খাস ফুডের কালোজিরা ফুলের কাঁচা ও প্রক্রিয়াজাতহীন মধু। রোগ প্রতিরোধ ক্ষমতা ও দৈনন্দিন পুষ্টির জন্য জনপ্রিয়।'),
  description_en = coalesce(description_en, 'Raw, unprocessed black seed (kalojira) flower honey from Khaas Food.')
where slug = 'khaas-food-black-seed-honey';

update products set
  specs = '[{"group":"Details","items":[{"label":"Honey Type","value":"Sundarban natural (Chaker modhu)"},{"label":"Origin","value":"Sundarbans, Bangladesh"},{"label":"Properties","value":"Wild mangrove multifloral honey"}]}]'::jsonb,
  description = coalesce(description, 'সুন্দরবনের প্রাকৃতিক চাকের মধু। ম্যানগ্রোভ বনের নানা ফুলের নির্যাস থেকে সংগৃহীত।'),
  description_en = coalesce(description_en, 'Wild mangrove multifloral honey harvested from natural hives in the Sundarbans, Bangladesh.')
where slug = 'ashol-sundarban-natural-honey';

update products set
  specs = '[{"group":"Details","items":[{"label":"Honey Type","value":"Black cumin (Kalojira) flower"},{"label":"Origin","value":"Bangladesh"},{"label":"Note","value":"May crystallize in the fridge"}]}]'::jsonb,
  description = coalesce(description, 'মডার্ন হার্বালের কালোজিরা ফুলের মধু। ফ্রিজে রাখলে বা শীতে প্রাকৃতিকভাবে জমতে পারে।'),
  description_en = coalesce(description_en, 'Black cumin (kalojira) flower honey; natural crystallization may occur when refrigerated.')
where slug = 'modern-herbal-black-cumin-flower-honey';

update products set
  specs = '[{"group":"Details","items":[{"label":"Honey Type","value":"Black seed (Kalojira) flower"},{"label":"Origin","value":"Bangladesh"},{"label":"Properties","value":"Dark, aromatic raw honey"}]}]'::jsonb,
  description = coalesce(description, 'আসল ব্র্যান্ডের কালোজিরা ফুলের খাঁটি মধু।'),
  description_en = coalesce(description_en, 'Pure Bangladeshi black seed (kalojira) flower honey with a distinct dark hue and aroma.')
where slug = 'ashol-blackseed-flower-honey';

update products set
  specs = '[{"group":"Details","items":[{"label":"Honey Type","value":"Mixed flower (Multifloral)"},{"label":"Origin","value":"Bangladesh"},{"label":"Use","value":"Daily energy, tea, baking and general wellness"}]}]'::jsonb,
  description = coalesce(description, 'বিভিন্ন ফুলের নির্যাস থেকে সংগৃহীত মিশ্র ফুলের প্রাকৃতিক মধু।'),
  description_en = coalesce(description_en, 'Bangladeshi mixed-flower multifloral honey suited for everyday dietary use.')
where slug = 'acure-mixed-flower-honey';

update products set
  specs = '[{"group":"Details","items":[{"label":"Honey Type","value":"Natural honey"},{"label":"Origin","value":"Dubai, UAE"},{"label":"Packaging","value":"Food-grade bottle / squeeze pack"}]}]'::jsonb,
  description = coalesce(description, 'দুবাই (সংযুক্ত আরব আমিরাত) থেকে আমদানিকৃত শেফা প্রাকৃতিক মধু।'),
  description_en = coalesce(description_en, 'Imported natural honey from Dubai, UAE.')
where slug = 'shefaa-natural-honey';

update products set
  specs = '[{"group":"Details","items":[{"label":"Honey Type","value":"Multifloral"},{"label":"Origin","value":"Bangladesh"},{"label":"Quality","value":"Lab-tested for purity, no added sugar"}]}]'::jsonb,
  description = coalesce(description, 'এসিআই পিওর মাল্টিফ্লোরাল মধু — বাড়তি চিনি বা প্রিজারভেটিভ ছাড়া ল্যাব-পরীক্ষিত খাঁটি মধু।'),
  description_en = coalesce(description_en, 'Lab-tested pure multifloral honey from ACI Bangladesh with no added sugar.')
where slug = 'aci-pure-multifloral-honey';

update products set
  specs = '[{"group":"Details","items":[{"label":"Honey Type","value":"Natural blossom (nectar) honey"},{"label":"Storage","value":"Cool, dry place; do not refrigerate"},{"label":"Origin","value":"Bangladesh (Hamdard)"}]}]'::jsonb,
  description = coalesce(description, 'হামদর্দের প্রাকৃতিক ফুলের মধু। সর্দি-কাশি, গলা ব্যথা ও দৈনন্দিন শক্তি জোগাতে ব্যবহৃত হয়।'),
  description_en = coalesce(description_en, 'Hamdard natural blossom honey; store in a cool, dry place without refrigeration.')
where slug = 'hamdard-honey';

update products set
  specs = '[{"group":"Details","items":[{"label":"Honey Type","value":"Lychee flower"},{"label":"Origin","value":"Bangladesh"},{"label":"Taste","value":"Light, mild and fruity floral sweetness"}]}]'::jsonb,
  description = coalesce(description, 'লিচু বাগানের ফুল থেকে সংগৃহীত মধু — হালকা, সুগন্ধি এবং ফলধর্মী মিষ্টি স্বাদের।'),
  description_en = coalesce(description_en, 'Light, aromatic lychee blossom honey from Bangladesh with a mild fruity sweetness.')
where slug = 'ashol-lychee-flower-honey';

update products set
  specs = '[{"group":"Details","items":[{"label":"Honey Type","value":"Multi-flower wild black honey"},{"label":"Certification","value":"USDA Organic"},{"label":"Properties","value":"Raw, unrefined dark forest honey rich in polyphenols and enzymes"}]}]'::jsonb,
  description = coalesce(description, 'USDA অর্গানিক সনদপ্রাপ্ত প্রাকৃতিক বুনো কালো মধু। অ্যান্টিঅক্সিডেন্ট ও প্রাকৃতিক এনজাইমসমৃদ্ধ।'),
  description_en = coalesce(description_en, 'USDA Organic certified raw multi-flower dark forest honey rich in antioxidants and natural enzymes.')
where slug = 'karkuma-organic-honey';

update products set
  specs = '[{"group":"Details","items":[{"label":"Honey Type","value":"Natural honey"},{"label":"Origin","value":"Saudi Arabia"},{"label":"Certification","value":"SASO, ISO 22000, Halal"}]}]'::jsonb,
  description = coalesce(description, 'সৌদি আরবের জনপ্রিয় আল-শিফা প্রাকৃতিক মধু — প্রিজারভেটিভমুক্ত ও হালাল সনদপ্রাপ্ত।'),
  description_en = coalesce(description_en, 'Pure Al Shifa natural honey from Saudi Arabia, Halal and ISO 22000 certified.')
where slug = 'al-shifa-natural-honey';

update products set
  specs = '[{"group":"Details","items":[{"label":"Honey Type","value":"Pure liquid honey"},{"label":"Origin","value":"Australia"},{"label":"Use","value":"Breakfast, baking, tea and dressings"}]}]'::jsonb,
  description = coalesce(description, 'অস্ট্রেলিয়ান প্রাকৃতিক তরল মধু — নাস্তা, চা ও বেকিংয়ের জন্য উপযোগী।'),
  description_en = coalesce(description_en, 'Pure Australian liquid honey ideal for breakfast, beverages, and cooking.')
where slug = 'american-gourmet-honey';

update products set
  specs = '[{"group":"Details","items":[{"label":"Honey Type","value":"Sundarbans mangrove wild forest honey (multifloral)"},{"label":"Flowers","value":"Sundari, Garan, Khalisa"},{"label":"Properties","value":"Raw, unprocessed wild forest honey"}]}]'::jsonb,
  description = coalesce(description, 'সুন্দরবনের সুন্দরী, গরান ও খলিসা ফুলের মধু — প্রাকৃতিক এনজাইম ও অ্যান্টিঅক্সিডেন্টসমৃদ্ধ।'),
  description_en = coalesce(description_en, 'Wild Sundarbans mangrove forest honey sourced from Sundari, Garan, and Khalisa blossoms.')
where slug = 'dabur-sundarbans-honey';

update products set
  specs = '[{"group":"Details","items":[{"label":"Honey Type","value":"Black Forest tree honey"},{"label":"Origin","value":"European mountain forests (Al Shifa, Saudi Arabia)"},{"label":"Texture","value":"Dark amber, thick, slow to crystallize"}]}]'::jsonb,
  description = coalesce(description, 'গাঢ় অ্যাম্বার রঙের আল-শিফা ব্ল্যাক ফরেস্ট মধু — ঘন ও উডি স্বাদের, সহজে জমে না।'),
  description_en = coalesce(description_en, 'Dark amber Al Shifa Black Forest honey harvested from forest tree nectar, resistant to crystallization.')
where slug = 'al-shifa-black-forest-honey';

update products set
  specs = '[{"group":"Details","items":[{"label":"Honey Type","value":"Acacia"},{"label":"Origin","value":"Al Shifa (Saudi Arabia)"},{"label":"Texture","value":"Light, clear and mild; stays liquid longer"}]}]'::jsonb,
  description = coalesce(description, 'আল-শিফা একাসিয়া মধু — স্বচ্ছ, হালকা মিষ্টি এবং দীর্ঘদিন তরল থাকে।'),
  description_en = coalesce(description_en, 'Light, clear Al Shifa Acacia honey with a delicate floral taste that stays liquid longer.')
where slug = 'al-shifa-acacia-honey';

-- Makeup (1)
update products set
  specs = '[{"group":"Details","items":[{"label":"Type","value":"Water-resistant mascara"},{"label":"Effect","value":"Volumizing, lifting and lengthening"},{"label":"Formula","value":"Deep ultra-black pigment; vegan & vegetarian friendly"},{"label":"Brush","value":"Mega wand for lash separation"}]}]'::jsonb,
  description = coalesce(description, 'পানিরোধী ও স্মাজ-প্রুফ মাসকারা যা পাপড়ি ঘন, লম্বা ও উঁচু দেখায়।'),
  description_en = coalesce(description_en, 'Water-resistant, vegan-friendly ultra-black mascara with a mega wand to lift, lengthen, and volumize lashes.')
where slug = 'technic-mega-lash-water-resistant-mascara';

-- Skincare (15)
update products set
  specs = '[{"group":"Details","items":[{"label":"Skin Type","value":"All skin types (especially dry/chapped lips)"},{"label":"Key Ingredients","value":"Sugar crystals, Honey extract, Shea butter"},{"label":"Use","value":"Gentle exfoliating lip scrub that removes dead skin and moisturizes"}]}]'::jsonb,
  description = coalesce(description, 'চিনির কণা ও মধুর নির্যাসযুক্ত লিপ স্ক্রাব — ঠোঁটের মরা চামড়া তুলে নরম ও আর্দ্র রাখে।'),
  description_en = coalesce(description_en, 'Gentle sugar and honey lip scrub that exfoliates dry, flaky skin while keeping lips moisturized.')
where slug = 'cosrx-full-fit-honey-sugar-lip-scrub';

update products set
  specs = '[{"group":"Details","items":[{"label":"Skin Type","value":"All skin types"},{"label":"Key Ingredients","value":"Ginseng root extract (10%), Retinal Liposome (2%), Niacinamide"},{"label":"Use","value":"Anti-aging eye serum for fine lines, wrinkles and dark circles"}]}]'::jsonb,
  description = coalesce(description, 'জিনসেং ও ২% রেটিনাল লাইপোসোম সমৃদ্ধ আই সিরাম — চোখের চারপাশের বলিরেখা ও ডার্ক সার্কেল কমাতে সাহায্য করে।'),
  description_en = coalesce(description_en, 'Targeted eye serum with 10% ginseng root extract and 2% retinal liposome to smooth fine lines and brighten the under-eye area.')
where slug = 'beauty-of-joseon-revive-eye-serum';

update products set
  specs = '[{"group":"Details","items":[{"label":"Skin Type","value":"All skin types (dry/flaky lips)"},{"label":"Key Ingredients","value":"Berry Mix Complex, Vitamin C, Hyaluronic Acid, Shea Butter"},{"label":"Use","value":"Overnight lip mask that deeply hydrates and reduces flakiness"}]}]'::jsonb,
  description = coalesce(description, 'বেরি মিক্স কমপ্লেক্স ও ভিটামিন সি সমৃদ্ধ ওভারনাইট লিপ মাস্ক — রাতভর ঠোঁটের শুষ্কতা ও ফাটা ভাব দূর করে।'),
  description_en = coalesce(description_en, 'Overnight lip sleeping mask enriched with Berry Mix Complex and Vitamin C to soften and hydrate dry, flaky lips.')
where slug = 'laneige-lip-sleeping-mask-berry';

update products set
  specs = '[{"group":"Details","items":[{"label":"Skin Type","value":"Sensitive, dry and damaged barrier"},{"label":"Key Ingredients","value":"Centella Asiatica (Cica), Hyaluronic Acid, Ceramide NP, Squalane"},{"label":"Use","value":"Overnight sleeping pack that calms redness and strengthens skin barrier"},{"label":"Free From","value":"Fragrance, essential oils"}]}]'::jsonb,
  description = coalesce(description, 'সেন্টেলা এশিয়াটিকা ও সিরামাইডযুক্ত ওভারনাইট স্লিপিং প্যাক — সংবেদনশীল ত্বকের লালচে ভাব কমিয়ে স্কিন ব্যারিয়ার মজবুত করে।'),
  description_en = coalesce(description_en, 'Fragrance-free overnight sleeping pack with cica, ceramides, and squalane to soothe irritation and repair the skin barrier.')
where slug = 'purito-dermide-cica-barrier-sleeping-pack';

update products set
  specs = '[{"group":"Details","items":[{"label":"Skin Type","value":"Oily, acne-prone and normal"},{"label":"Key Ingredients","value":"Neem, Turmeric"},{"label":"Use","value":"Soap-free herbal face wash that helps clear pimples and excess oil"}]}]'::jsonb,
  description = coalesce(description, 'নিম ও হলুদের গুণসমৃদ্ধ সাবানমুক্ত হার্বাল ফেসওয়াশ — অতিরিক্ত তেল ও ব্রণ কমাতে সাহায্য করে।'),
  description_en = coalesce(description_en, 'Soap-free herbal gel face wash with neem and turmeric to purify pores and help prevent pimples.')
where slug = 'himalaya-purifying-neem-face-wash';

update products set
  specs = '[{"group":"Details","items":[{"label":"Skin Type","value":"All skin types (oily, combination, sensitive)"},{"label":"Key Ingredients","value":"Tea Tree Oil, BHA (Betaine Salicylate)"},{"label":"pH Level","value":"5.0 - 6.0 (mildly acidic)"},{"label":"Use","value":"Gentle morning gel cleanser that removes overnight sebum without stripping"}]}]'::jsonb,
  description = coalesce(description, 'টি-ট্রি অয়েল ও বিএইচএ-যুক্ত মৃদু অ্যাসিডিক (pH ৫.০–৬.০) জেল ক্লিনজার — ত্বক শুষ্ক না করেই পরিষ্কার করে।'),
  description_en = coalesce(description_en, 'Mildly acidic (pH 5.0-6.0) morning gel cleanser with tea tree oil and BHA to gently clear pores without stripping.')
where slug = 'cosrx-low-ph-good-morning-gel-cleanser-50ml';

update products set
  specs = '[{"group":"Details","items":[{"label":"Skin Type","value":"Dry, chapped lips"},{"label":"Key Ingredients","value":"Triple-purified Petroleum Jelly, Rose & Almond Oils"},{"label":"Use","value":"Tinted lip balm tin that locks in moisture with a sheer rosy glow"}]}]'::jsonb,
  description = coalesce(description, 'ট্রিপল-পিউরিফায়েড পেট্রোলিয়াম জেলিযুক্ত লিপ বাম — শুষ্ক ঠোঁটে আর্দ্রতা ধরে রাখে এবং হালকা গোলাপি আভা দেয়।'),
  description_en = coalesce(description_en, 'Moisturizing lip balm tin made with triple-purified petroleum jelly for dry lips with a subtle rosy tint.')
where slug = 'vaseline-lip-therapy-rosy-lips';

update products set
  specs = '[{"group":"Details","items":[{"label":"Type","value":"pH-reactive tinted lip oil"},{"label":"Key Ingredients","value":"Vitamin E, Jojoba Oil"},{"label":"Finish","value":"Non-sticky, glossy custom pink tint"}]}]'::jsonb,
  description = coalesce(description, 'ভিটামিন ই সমৃদ্ধ pH-রিঅ্যাক্টিভ লিপ অয়েল — ঠোঁটের পিএইচ অনুযায়ী প্রাকৃতিক গোলাপি আভা ও গ্লসি ফিনিশ দেয়।'),
  description_en = coalesce(description_en, 'Vitamin E enriched pH-reactive lip oil that adapts to your lip pH for a custom glossy tint.')
where slug = 'swiss-beauty-dip-tint-lip-oil';

update products set
  specs = '[{"group":"Details","items":[{"label":"Type","value":"Water-based lip & cheek tint"},{"label":"Key Ingredients","value":"Pomegranate & Grapefruit Extracts, Trehalose"},{"label":"Finish","value":"Lightweight, buildable natural tint"}]},{"group":"Ingredients","items":[{"label":"Full Ingredients","value":"Water, Butylene Glycol, Trehalose, 1,2-Hexanediol, Pentylene Glycol, PEG-60 Hydrogenated Castor Oil, Sunset Yellow FCF, Fast Acid Magenta, Glyceryl Caprylate, Fragrance, Eosine YS, Alizarine Cyanine Green F, Glycerin, Brilliant Blue FCF, Propanediol, Punica Granatum Fruit Juice, Rubus Idaeus (Raspberry) Juice, Vitis Vinifera (Grape) Juice"}]}]'::jsonb,
  description = coalesce(description, 'পানির মতো হালকা ওয়াটার টিন্ট — ঠোঁট ও গালে দীর্ঘস্থায়ী প্রাকৃতিক রঙ আনে।'),
  description_en = coalesce(description_en, 'Lightweight, fruity water-based lip and cheek tint that absorbs quickly for a natural flush.')
where slug = 'etude-dear-darling-water-tint';

update products set
  specs = '[{"group":"Details","items":[{"label":"Skin Type","value":"Dry, flaky lips"},{"label":"Key Ingredients","value":"Honey-6 Complex (Propolis, Honey, Royal Jelly), Shea Butter"},{"label":"Use","value":"Overnight nourishing lip mask for plump, hydrated lips"}]}]'::jsonb,
  description = coalesce(description, 'প্রোপোলিস ও মধুর নির্যাসসমৃদ্ধ ওভারনাইট লিপ মাস্ক — শুষ্ক ও ফাটা ঠোঁটকে কোমল ও পুষ্ট রাখে।'),
  description_en = coalesce(description, 'Nourishing overnight lip mask with COSRX Honey-6 Complex and shea butter for soft, hydrated lips.')
where slug = 'cosrx-propolis-lip-sleeping-mask';

update products set
  specs = '[{"group":"Details","items":[{"label":"Skin Type","value":"Oily, acne-prone"},{"label":"Key Ingredients","value":"Salicylic Acid, Niacinamide, Zinc Gluconate, Vitamin C & E"},{"label":"Use","value":"Clears excess sebum and dirt from pores, helps control acne and redness"}]}]'::jsonb,
  description = coalesce(description, 'স্যালিসিলিক অ্যাসিড ও নায়াসিনামাইডযুক্ত অ্যান্টি-একনে ফেসওয়াশ — অতিরিক্ত তেল ও ব্রণ নিয়ন্ত্রণে সাহায্য করে।'),
  description_en = coalesce(description_en, 'Acne-control creamy face wash with salicylic acid, niacinamide, and zinc gluconate to clear excess sebum.')
where slug = 'acnes-creamy-wash';

update products set
  specs = '[{"group":"Details","items":[{"label":"Type","value":"Hydrating lip oil"},{"label":"Key Ingredients","value":"Vitamin E, Jojoba Oil, Shea Butter"},{"label":"Finish","value":"High-shine, non-sticky cushiony gloss"}]}]'::jsonb,
  description = coalesce(description, 'ভিটামিন ই, জোজোবা অয়েল ও শিয়া বাটারসমৃদ্ধ গ্লসি লিপ অয়েল — ঠোঁট আর্দ্র ও উজ্জ্বল রাখে।'),
  description_en = coalesce(description_en, 'Glossy, hydrating lip oil formulated with Vitamin E, jojoba oil, and shea butter.')
where slug = 'beauty-glazed-glazed-glow-lip-oil';

update products set
  specs = '[{"group":"Details","items":[{"label":"Skin Type","value":"Oily, combination, acne-prone & normal"},{"label":"Protection","value":"SPF 50+ PA++++"},{"label":"Key Ingredients","value":"Watermelon Extract, Hyaluronic Acid, Menthyl Lactate"},{"label":"Finish","value":"Cooling aqua-gel texture; zero white cast"}]}]'::jsonb,
  description = coalesce(description, 'তরমুজ ও হায়ালুরনিক অ্যাসিডসমৃদ্ধ SPF 50+ PA++++ কুলিং জেল সানস্ক্রিন — কোনো হোয়াইট কাস্ট ছাড়াই ত্বকে ঠান্ডা অনুভূতি দেয়।'),
  description_en = coalesce(description_en, 'SPF 50+ PA++++ cooling aqua-gel sunscreen with watermelon extract and hyaluronic acid; zero white cast.')
where slug = 'dot-key-watermelon-cooling-sunscreen-spf50-pa-80g';

update products set
  specs = '[{"group":"Details","items":[{"label":"Skin Type","value":"All skin types (especially dehydrated, sensitive, oily-dehydrated)"},{"label":"Key Ingredients","value":"5D-Complex Low-Molecular Hyaluronic Acid, Panthenol, Allantoin, Madecassoside"},{"label":"Free From","value":"Fragrance, essential oils, drying alcohol"},{"label":"Texture","value":"Watery, fast-absorbing, non-sticky"}]}]'::jsonb,
  description = coalesce(description, '৫ডি কমপ্লেক্স হায়ালুরনিক অ্যাসিড ও প্যানথেনলসমৃদ্ধ হালকা হাইড্রেটিং সিরাম — সুগন্ধিমুক্ত ও দ্রুত ত্বকে মিশে যায়।'),
  description_en = coalesce(description_en, 'Fragrance-free hydrating serum with 5D-Complex low-molecular hyaluronic acid and panthenol for fast, non-sticky moisture.')
where slug = 'torriden-dive-in-low-molecule-hyaluronic-acid-serum-50ml';

update products set
  specs = '[{"group":"Details","items":[{"label":"Skin Type","value":"Acne-prone, all skin types"},{"label":"Key Ingredients","value":"100% Hydrocolloid"},{"label":"Use","value":"Absorbs pus/fluid and protects pimples from bacteria and picking"},{"label":"Pack Contents","value":"24 patches in 3 sizes (7mm, 10mm, 12mm)"}]}]'::jsonb,
  description = coalesce(description, '৩ সাইজের ২৪টি হাইড্রোকলয়েড পিম্পল প্যাচ — ব্রণের ফোলা ও রস শুষে নিয়ে দ্রুত সারাতে সাহায্য করে।'),
  description_en = coalesce(description_en, '24 hydrocolloid acne patches in 3 sizes that absorb impurities and protect blemishes from external bacteria.')
where slug = 'cosrx-acne-pimple-master-patch-24pcs';

-- Water Purifiers (6) — split monolithic "Others" into structured rows
update products set
  specs = '[{"group":"Purification","items":[{"label":"Stages","value":"RO + MF"},{"label":"Storage Capacity","value":"6 Litres"},{"label":"Flow Rate","value":"~20 Litres/hour"},{"label":"Germkill Capacity","value":"~6,000 Litres"},{"label":"TDS Reduction","value":"90% (Min), max input TDS 2,000 mg/L"}]},{"group":"Power & Build","items":[{"label":"Power Rating","value":"36 Watts"},{"label":"Operating Voltage","value":"100-240 V, 50/60 Hz"},{"label":"Pump","value":"24V DC Diaphragm Pump"},{"label":"Body Material","value":"Food-safe engineering-grade plastic"}]}]'::jsonb,
  description = coalesce(description, '৬ লিটার স্টোরেজসহ RO+MF ওয়াটার পিউরিফায়ার — প্রতি ঘণ্টায় ~২০ লিটার বিশুদ্ধ পানি ও ৬,০০০ লিটার পর্যন্ত জার্মকিল ক্ষমতা।'),
  description_en = coalesce(description_en, 'Pureit Wave 6L RO+MF water purifier with 20 L/hr flow rate, 6,000L Germkill capacity, and 90% minimum TDS reduction.')
where slug = 'pureit-wave-ro-mf-6l';

update products set
  specs = '[{"group":"Purification","items":[{"label":"Stages","value":"RO + UV + MF + Mineral"},{"label":"Storage Capacity","value":"10 Litres"},{"label":"Flow Rate","value":"~28 Litres/hour"},{"label":"Germkill Capacity","value":"4,000L / 8,000L"},{"label":"TDS Reduction","value":"90% (Min), max input TDS 2,000 mg/L"}]},{"group":"Power & Build","items":[{"label":"Power Rating","value":"60 Watts"},{"label":"Operating Voltage","value":"100-240 V, 50/60 Hz"},{"label":"Pump","value":"24V DC Diaphragm Pump"},{"label":"Body Material","value":"Food-safe engineering-grade plastic"}]}]'::jsonb,
  description = coalesce(description, '১০ লিটার স্টোরেজ ও মিনারেল প্রযুক্তিসহ RO+UV+MF ওয়াটার পিউরিফায়ার — ঘণ্টায় ~২৮ লিটার বিশুদ্ধ পানি সরবরাহ করে।'),
  description_en = coalesce(description_en, 'Pureit Ultima Mineral 10L RO+UV+MF water purifier with 28 L/hr flow rate, mineral enrichment, and 90% TDS reduction.')
where slug = 'pureit-ultima-mineral-ro-uv-mf-10l';

update products set
  specs = '[{"group":"Purification","items":[{"label":"Purification Type","value":"Non-electric Germkill Kit"},{"label":"Total Volume","value":"23 Litres (9L purified storage)"},{"label":"Germkill Capacity","value":"~1,500 Litres"},{"label":"Safety Standard","value":"Meets US EPA microbiological criteria"}]},{"group":"Build","items":[{"label":"Power Required","value":"None (gravity-fed)"},{"label":"Body Material","value":"Food-safe engineering-grade plastic"}]}]'::jsonb,
  description = coalesce(description, 'বিদ্যুৎ ছাড়া চলা ২৩ লিটারের (৯ লিটার বিশুদ্ধ স্টোরেজ) ক্লাসিক ওয়াটার পিউরিফায়ার — ১,৫০০ লিটার পর্যন্ত জার্মকিল ক্ষমতা।'),
  description_en = coalesce(description_en, 'Non-electric gravity-fed 23L water purifier (9L purified storage) with 1,500L Germkill Kit capacity.')
where slug = 'pureit-classic-23l';

update products set
  specs = '[{"group":"Purification","items":[{"label":"Stages","value":"RO + UV"},{"label":"Storage Capacity","value":"7 Litres"},{"label":"Flow Rate","value":"~24 Litres/hour"},{"label":"Germkill Capacity","value":"~6,000 Litres"},{"label":"Recovery & TDS","value":"~60% recovery; 90% (Min) TDS reduction"}]},{"group":"Power & Build","items":[{"label":"Power Rating","value":"42 Watts"},{"label":"Operating Voltage","value":"100-240 V, 50/60 Hz"},{"label":"Pump","value":"24V DC Diaphragm Pump"},{"label":"Body Material","value":"Food-safe engineering-grade plastic"}]}]'::jsonb,
  description = coalesce(description, '৭ লিটার স্টোরেজ ও ~৬০% ওয়াটার রিকভারিসহ RO+UV ওয়াটার পিউরিফায়ার — ঘণ্টায় ~২৪ লিটার পানি বিশুদ্ধ করে।'),
  description_en = coalesce(description_en, 'Pureit Vital Max 7L RO+UV water purifier with 24 L/hr flow rate, 60% water recovery, and 6,000L Germkill capacity.')
where slug = 'pureit-vital-max-ro-uv-7l';

update products set
  specs = '[{"group":"Purification","items":[{"label":"Stages","value":"RO + MF + Dual UV"},{"label":"Storage Capacity","value":"9 Litres"},{"label":"Flow Rate","value":"~28 Litres/hour"},{"label":"Germkill Capacity","value":"4,000L / 8,000L"},{"label":"Recovery & TDS","value":"~70% recovery; 90% (Min) TDS reduction"}]},{"group":"Power & Build","items":[{"label":"Power Rating","value":"37 Watts"},{"label":"Operating Voltage","value":"100-240 V, 50/60 Hz"},{"label":"Pump","value":"24V DC Diaphragm Pump"},{"label":"Body Material","value":"Food-safe engineering-grade plastic"}]}]'::jsonb,
  description = coalesce(description, '৯ লিটার স্টোরেজ ও ~৭০% ওয়াটার রিকভারিসহ RO+MF+Dual UV ওয়াটার পিউরিফায়ার — ঘণ্টায় ~২৮ লিটার বিশুদ্ধ পানি।'),
  description_en = coalesce(description_en, 'Pureit Ultima Pro 9L RO+MF+Dual UV water purifier with 70% water recovery and 28 L/hr flow rate.')
where slug = 'pureit-ultima-pro-ro-mf-dual-uv-9l';

update products set
  specs = '[{"group":"Purification","items":[{"label":"Stages","value":"RO + UV + MF"},{"label":"Storage Capacity","value":"6 Litres"},{"label":"Flow Rate","value":"~20 Litres/hour"},{"label":"Germkill Capacity","value":"~6,000 Litres"},{"label":"TDS Reduction","value":"90% (Min), max input TDS 2,000 mg/L"}]},{"group":"Power & Build","items":[{"label":"Power Rating","value":"37 Watts"},{"label":"Operating Voltage","value":"100-240 V, 50/60 Hz"},{"label":"Pump","value":"24V DC Diaphragm Pump"},{"label":"Body Material","value":"Food-safe engineering-grade plastic"}]}]'::jsonb,
  description = coalesce(description, '৬ লিটার স্টোরেজসহ RO+UV+MF ওয়াটার পিউরিফায়ার — ঘণ্টায় ~২০ লিটার বিশুদ্ধ পানি ও ৬,০০০ লিটার জার্মকিল ক্ষমতা।'),
  description_en = coalesce(description_en, 'Pureit Marina 6L RO+UV+MF water purifier with 20 L/hr flow rate, 6,000L Germkill capacity, and 90% TDS reduction.')
where slug = 'pureit-marina-ro-uv-mf-6l';

commit;
