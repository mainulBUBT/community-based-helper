-- চার্জার ক্যাটাগরির ভ্যারিয়েন্ট অক্ষ হিসেবে wattage দরকার (db:push চালাতে হবে)
alter table categories drop constraint if exists categories_variant_axes_check;
alter table categories add constraint categories_variant_axes_check
  check (variant_axes <@ '{chip,ram,storage,size,connectivity,edition,color,gpu,cpu,resolution,battery,capacity,wattage}');
