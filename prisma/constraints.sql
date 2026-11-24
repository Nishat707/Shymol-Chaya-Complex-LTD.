-- Run once after the first migration: psql "$DIRECT_URL" -f prisma/constraints.sql
-- Database-level money rules, so they hold even if application code has a bug.
ALTER TABLE "Payment" ADD CONSTRAINT payment_amount_positive CHECK (amount > 0);
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT alloc_amount_positive CHECK (amount > 0);
ALTER TABLE "MonthlyCharge" ADD CONSTRAINT charge_amount_nonneg CHECK (amount >= 0 AND waived >= 0 AND waived <= amount);
ALTER TABLE "Expense" ADD CONSTRAINT expense_amount_positive CHECK (amount > 0);

-- Financial rows can be voided, never deleted.
CREATE OR REPLACE FUNCTION forbid_delete() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'Deleting % is not allowed. Void it with a reason instead.', TG_TABLE_NAME; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER no_delete_payment BEFORE DELETE ON "Payment" FOR EACH ROW EXECUTE FUNCTION forbid_delete();
CREATE TRIGGER no_delete_alloc BEFORE DELETE ON "PaymentAllocation" FOR EACH ROW EXECUTE FUNCTION forbid_delete();
CREATE TRIGGER no_delete_charge BEFORE DELETE ON "MonthlyCharge" FOR EACH ROW EXECUTE FUNCTION forbid_delete();
CREATE TRIGGER no_delete_expense BEFORE DELETE ON "Expense" FOR EACH ROW EXECUTE FUNCTION forbid_delete();
CREATE TRIGGER no_delete_audit BEFORE DELETE ON "AuditLog" FOR EACH ROW EXECUTE FUNCTION forbid_delete();

-- Block direct browser access with the public anon key (no policies = no access).
-- The server connects as the database owner through Prisma, which bypasses RLS.
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['User','Flat','FlatResident','ChargeSetting','MonthlyCharge','Payment','PaymentAllocation','ExpenseCategory','Expense','MaintenanceTask','Notice','MonthClose','Counter','Setting','AuditLog']
  LOOP EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t); END LOOP;
END $$;
