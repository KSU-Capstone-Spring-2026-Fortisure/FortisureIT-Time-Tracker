BEGIN;

WITH role_lookup AS (
  SELECT
    MAX(CASE WHEN LOWER(role_name) = 'manager' THEN id END) AS manager_role_id,
    MAX(CASE WHEN LOWER(role_name) = 'user' THEN id END) AS employee_role_id,
    MAX(CASE WHEN LOWER(role_name) = 'admin' THEN id END) AS admin_role_id
  FROM roles
  WHERE is_deleted IS NOT TRUE
),
manager_parent AS (
  SELECT id
  FROM users
  WHERE is_deleted IS NOT TRUE
    AND is_active IS TRUE
    AND role_id = (SELECT admin_role_id FROM role_lookup)
  ORDER BY id
  LIMIT 1
),
upsert_jason AS (
  INSERT INTO users (
    user_uuid,
    role_id,
    full_name,
    email,
    is_active,
    password_hash,
    is_deleted,
    manager_user_id
  )
  SELECT
    gen_random_uuid(),
    role_lookup.manager_role_id,
    'Jason Graham',
    'jgraha45@kent.edu',
    TRUE,
    NULL,
    FALSE,
    manager_parent.id
  FROM role_lookup
  LEFT JOIN manager_parent ON TRUE
  WHERE role_lookup.manager_role_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM users
      WHERE LOWER(email) = 'jgraha45@kent.edu'
    )
  RETURNING id
),
jason_record AS (
  SELECT id
  FROM upsert_jason
  UNION ALL
  SELECT id
  FROM users
  WHERE LOWER(email) = 'jgraha45@kent.edu'
  LIMIT 1
),
upsert_elijah AS (
  INSERT INTO users (
    user_uuid,
    role_id,
    full_name,
    email,
    is_active,
    password_hash,
    is_deleted,
    manager_user_id
  )
  SELECT
    gen_random_uuid(),
    role_lookup.employee_role_id,
    'Elijah Rogers',
    'eroger25@kent.edu',
    TRUE,
    NULL,
    FALSE,
    jason_record.id
  FROM role_lookup
  CROSS JOIN jason_record
  WHERE role_lookup.employee_role_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM users
      WHERE LOWER(email) = 'eroger25@kent.edu'
    )
  RETURNING id
),
sync_relationships AS (
  UPDATE users u
  SET
    role_id = CASE
      WHEN LOWER(u.email) = 'jgraha45@kent.edu' THEN (SELECT manager_role_id FROM role_lookup)
      WHEN LOWER(u.email) = 'eroger25@kent.edu' THEN (SELECT employee_role_id FROM role_lookup)
      ELSE u.role_id
    END,
    manager_user_id = CASE
      WHEN LOWER(u.email) = 'jgraha45@kent.edu' THEN COALESCE((SELECT id FROM manager_parent), u.manager_user_id)
      WHEN LOWER(u.email) = 'eroger25@kent.edu' THEN (SELECT id FROM jason_record)
      ELSE u.manager_user_id
    END,
    is_active = TRUE,
    is_deleted = FALSE
  WHERE LOWER(u.email) IN ('jgraha45@kent.edu', 'eroger25@kent.edu')
  RETURNING u.id, u.email
),
grant_client_access AS (
  INSERT INTO user_client_access (user_id, client_id, is_deleted)
  SELECT
    target_users.id,
    client_ids.client_id,
    FALSE
  FROM (
    SELECT id
    FROM users
    WHERE LOWER(email) IN ('jgraha45@kent.edu', 'eroger25@kent.edu')
  ) AS target_users
  CROSS JOIN (
    SELECT id AS client_id
    FROM clients
    WHERE is_deleted IS NOT TRUE
      AND is_active IS TRUE
      AND id IN (1, 2)
  ) AS client_ids
  WHERE NOT EXISTS (
    SELECT 1
    FROM user_client_access existing_access
    WHERE existing_access.user_id = target_users.id
      AND existing_access.client_id = client_ids.client_id
      AND existing_access.is_deleted IS NOT TRUE
  )
  RETURNING user_id, client_id
)
SELECT
  users.id,
  users.full_name,
  users.email,
  users.manager_user_id,
  roles.role_name
FROM users
LEFT JOIN roles ON roles.id = users.role_id
WHERE LOWER(users.email) IN ('jgraha45@kent.edu', 'eroger25@kent.edu')
ORDER BY users.full_name ASC;

COMMIT;
