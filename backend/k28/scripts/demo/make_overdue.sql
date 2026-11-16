UPDATE tien_do_the t
JOIN nguoi_dung u ON u.id = t.nguoi_dung_id
SET t.han_on_at = DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 2 + MOD(t.id, 6) DAY)
WHERE u.email = 'binh@vocab.local'
  AND t.han_on_at IS NOT NULL;

SELECT u.email, COUNT(*) AS the_qua_han
FROM tien_do_the t JOIN nguoi_dung u ON u.id = t.nguoi_dung_id
WHERE u.email IN ('an@vocab.local', 'binh@vocab.local', 'chi@vocab.local') AND t.han_on_at < UTC_TIMESTAMP(3)
GROUP BY u.email;
