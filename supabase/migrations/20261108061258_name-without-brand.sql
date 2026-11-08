-- সাইট নামের আগে ব্র্যান্ড বসায়; ১৪টা পণ্যের নামেও ব্র্যান্ড ছিল ("Anker Anker Zolo ...")। নাম থেকে শুরুর ব্র্যান্ড বাদ।
-- slug বদলায় না, তাই পুরনো লিংক ঠিক থাকে।
update products
set name = btrim(substr(name, length(brand) + 2))
where length(name) > length(brand) + 1
  and lower(left(name, length(brand) + 1)) = lower(brand) || ' ';
