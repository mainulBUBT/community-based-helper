-- ২০২৬-১১-১১: পুরনো মডেল, স্টকসহ দোকান ২টার কম, ৩০ দিনে কেউ খোলেনি; মালিকের কথায় মোছা। variants/offers/alerts cascade-এ যায়।
begin;

delete from products where id = '0f074465-db63-f6cb-8faf-53411fa94f78' and slug = 'anker-soundcore-motion';
delete from products where id = 'ba6ce079-5440-05c5-6ec3-d5bc0ac51fee' and slug = 'apple-mac-mini-m2-pro';
delete from products where id = 'f6f0980b-6ee7-2042-d50b-d8c2dd9aeb13' and slug = 'apple-macbook-pro-14-m2-pro';

commit;
