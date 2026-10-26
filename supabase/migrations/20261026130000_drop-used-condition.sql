-- ব্যবহৃত দাম রাখা হচ্ছে না: ক্যাটাগরির দামের ধরন থেকে used বাদ (enum এর মানটা থাকে, কোথাও বাছাই করা যায় না)
alter table categories alter column conditions set default '{official,unofficial}';
update categories set conditions = array_remove(conditions, 'used') where 'used' = any (conditions);
