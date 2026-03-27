import { pgTable, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
export const paymentStatusEnum = pgEnum("payment_status", ["pending","completed","failed","refunded"]);
export const paymentTypeEnum = pgEnum("payment_type", ["subscription","one_time"]);
export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
});
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
