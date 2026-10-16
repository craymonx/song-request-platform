UPDATE songs SET enabled = 0;
--> statement-breakpoint
WITH new_songs(title) AS (
  VALUES
    ('蜚蜚'),
    ('不許你注定一人'),
    ('絕'),
    ('分手總約在雨天'),
    ('到此為止'),
    ('沙龍'),
    ('假使世界原來不像你預期'),
    ('追'),
    ('垃圾'),
    ('傾城'),
    ('不浪漫罪名'),
    ('誰明浪子心'),
    ('勿念'),
    ('錯誤的宇宙尋找愛'),
    ('木紋'),
    ('思覺失調'),
    ('在流浮山滴眼水'),
    ('勞斯萊斯'),
    ('東京人壽'),
    ('山林道')
)
INSERT INTO songs (title, artist, language, category, key, notes, enabled, created_at)
SELECT new_songs.title, '', '粵語', '', '', '', 1, CURRENT_TIMESTAMP
FROM new_songs
WHERE NOT EXISTS (
  SELECT 1 FROM songs WHERE songs.title = new_songs.title
);
--> statement-breakpoint
UPDATE songs SET enabled = 1
WHERE title IN (
  '蜚蜚', '不許你注定一人', '絕', '分手總約在雨天', '到此為止',
  '沙龍', '假使世界原來不像你預期', '追', '垃圾', '傾城',
  '不浪漫罪名', '誰明浪子心', '勿念', '錯誤的宇宙尋找愛', '木紋',
  '思覺失調', '在流浮山滴眼水', '勞斯萊斯', '東京人壽', '山林道'
);
--> statement-breakpoint
PRAGMA optimize;
