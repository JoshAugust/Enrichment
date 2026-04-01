PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE portal_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id TEXT NOT NULL,
      company_slug TEXT NOT NULL,
      viewed_at TEXT NOT NULL DEFAULT (datetime('now')),
      ip_address TEXT,
      user_agent TEXT
    );
INSERT INTO portal_views VALUES(1,'22530fe7-5fc8-4a56-8df0-8b57774cfda5','tensorwave','2026-03-23 00:31:33','::1','curl/8.7.1');
INSERT INTO portal_views VALUES(2,'22530fe7-5fc8-4a56-8df0-8b57774cfda5','tensorwave','2026-03-23 00:32:42','::1','curl/8.7.1');
INSERT INTO portal_views VALUES(3,'22530fe7-5fc8-4a56-8df0-8b57774cfda5','tensorwave','2026-03-23 00:33:12','::1','curl/8.7.1');
INSERT INTO portal_views VALUES(4,'4466d29b-d07a-4620-9862-74dc5923fe37','upper90','2026-03-23 00:33:12','::1','curl/8.7.1');
INSERT INTO portal_views VALUES(5,'22530fe7-5fc8-4a56-8df0-8b57774cfda5','tensorwave','2026-03-23 00:35:33','::1','curl/8.7.1');
INSERT INTO portal_views VALUES(6,'4466d29b-d07a-4620-9862-74dc5923fe37','upper90','2026-03-23 00:35:33','::1','curl/8.7.1');
INSERT INTO portal_views VALUES(7,'22530fe7-5fc8-4a56-8df0-8b57774cfda5','tensorwave','2026-03-23 00:37:11','::1','curl/8.7.1');
INSERT INTO portal_views VALUES(8,'22530fe7-5fc8-4a56-8df0-8b57774cfda5','tensorwave','2026-03-23 00:37:26','::1','curl/8.7.1');
COMMIT;
