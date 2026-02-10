-- One-time fix: we renamed migration folder 20250223212510_init -> 20250101000000_init
-- so it runs first on the shadow DB (Product table must exist before 20250130... runs).
-- Run this ONCE against your database, then run: npx prisma migrate dev --name add_order_attribution

UPDATE "_prisma_migrations"
SET migration_name = '20250101000000_init'
WHERE migration_name = '20250223212510_init';
