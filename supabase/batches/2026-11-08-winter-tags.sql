-- শীতের নতুন ১৩টা পণ্যের অন্য নাম; migration 20261108120000_product-tags.sql চলার পরে
update products set tags = '{ভ্যাসলিন,ভেসলিন,vasline,petroleum jelly,পেট্রোলিয়াম জেলি}' where slug = 'vaseline-original-petroleum-jelly';
update products set tags = '{ভ্যাসলিন,ভেসলিন,vasline,lip balm,লিপ বাম,ঠোঁটের বাম}' where slug = 'vaseline-lip-therapy-original';
update products set tags = '{ভ্যাসলিন,ভেসলিন,vasline,lip balm,লিপ বাম,ঠোঁটের বাম}' where slug = 'vaseline-lip-therapy-rosy-lips';
update products set tags = '{ভ্যাসলিন,ভেসলিন,vasline,body lotion,বডি লোশন,cocoa butter lotion}' where slug = 'vaseline-intensive-care-cocoa-radiant-lotion';
update products set tags = '{নিভিয়া,nivea cream,নিভিয়া ক্রিম,moisturizer,ময়েশ্চারাইজার}' where slug = 'nivea-soft';
update products set tags = '{নিভিয়া,body lotion,বডি লোশন,nivea body milk}' where slug = 'nivea-nourishing-body-lotion';
update products set tags = '{সেরাভি,সেরাভে,body lotion,বডি লোশন}' where slug = 'cerave-moisturising-lotion';
update products set tags = '{সেটাফিল,সিটাফিল,moisturizer,ময়েশ্চারাইজার}' where slug = 'cetaphil-moisturizing-cream';
update products set tags = '{সেটাফিল,সিটাফিল,body lotion,বডি লোশন}' where slug = 'cetaphil-moisturizing-lotion';
update products set tags = '{সেরাভি,সেরাভে,বেবি লোশন}' where slug = 'cerave-baby-moisturizing-lotion';
update products set tags = '{সেটাফিল,সিটাফিল,বেবি লোশন}' where slug = 'cetaphil-baby-daily-lotion';
update products set tags = '{জনসন,জনসনস,johnson,বেবি লোশন}' where slug = 'johnsons-baby-lotion';
update products set tags = '{জনসন,জনসনস,johnson,বেবি ক্রিম}' where slug = 'johnsons-baby-cream';
