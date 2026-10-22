-- 20261021160000 এ ল্যাপটপ/ডেস্কটপে cpu/gpu চালু হয়েছিল, পরে কোথাও আবার পুরনো মানে ফিরে গেছে।
-- একই মান আবার বসানো (নিরীহ, যতবারই চলুক)।
update categories set variant_axes = '{chip,ram,storage,cpu,gpu}' where slug in ('laptop', 'desktop');
