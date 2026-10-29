ALTER TABLE "trip_runs" ADD COLUMN "notification_status" varchar(20);--> statement-breakpoint
ALTER TABLE "trip_runs" ADD COLUMN "notification_ref" varchar(64);--> statement-breakpoint
ALTER TABLE "trip_runs" ADD COLUMN "notified_at" timestamp with time zone;