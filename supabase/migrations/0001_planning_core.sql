CREATE TABLE "catalogue_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ref" varchar(32) NOT NULL,
	"kind" varchar(20) NOT NULL,
	"city_id" integer NOT NULL,
	"city_name" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"price_amount" numeric(10, 2),
	"price_currency" char(3),
	"price_unit" varchar(20),
	"attributes" jsonb NOT NULL,
	CONSTRAINT "catalogue_entries_ref_unique" UNIQUE("ref")
);
--> statement-breakpoint
ALTER TABLE "catalogue_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(20) NOT NULL,
	"name" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "people" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profile_facts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subject_person_id" uuid,
	"kind" varchar(30) NOT NULL,
	"domain" varchar(20) NOT NULL,
	"value" text NOT NULL,
	"rule_status" varchar(20) NOT NULL,
	"rule" jsonb,
	"rule_summary" text,
	"rule_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile_facts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "trip_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"date" date NOT NULL,
	"title" varchar(200),
	"note" text,
	"title_set_by_traveller" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trip_days" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "trip_gaps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"date" date,
	"kind" varchar(20) NOT NULL,
	"reason" varchar(30) NOT NULL,
	"facts" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trip_gaps" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "trip_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"day_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"kind" varchar(20) NOT NULL,
	"catalogue_entry_id" uuid NOT NULL,
	"source" varchar(32) NOT NULL,
	"name" varchar(200) NOT NULL,
	"time" time NOT NULL,
	"end_time" time,
	"price_amount" numeric(10, 2),
	"price_currency" char(3),
	"price_unit" varchar(20),
	"transport" jsonb,
	"why" text NOT NULL,
	"cited_facts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" varchar(20) NOT NULL,
	"note" text,
	"removed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "trip_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "trip_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"author" varchar(20) NOT NULL,
	"kind" varchar(20) NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trip_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "trip_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"status" varchar(20) NOT NULL,
	"failure_reason" text,
	"draft_plan" jsonb,
	"rejections" integer DEFAULT 0 NOT NULL,
	"exclusions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"unverified_facts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trip_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "trip_travellers" (
	"trip_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	CONSTRAINT "trip_travellers_trip_id_person_id_pk" PRIMARY KEY("trip_id","person_id")
);
--> statement-breakpoint
ALTER TABLE "trip_travellers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"origin" jsonb NOT NULL,
	"destination" jsonb NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"notes" text,
	"status" varchar(20) NOT NULL,
	"failure_reason" text,
	"whatsapp_number" varchar(20),
	"whatsapp_opt_in" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trips" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_facts" ADD CONSTRAINT "profile_facts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_facts" ADD CONSTRAINT "profile_facts_subject_person_id_people_id_fk" FOREIGN KEY ("subject_person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_days" ADD CONSTRAINT "trip_days_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_gaps" ADD CONSTRAINT "trip_gaps_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_items" ADD CONSTRAINT "trip_items_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_items" ADD CONSTRAINT "trip_items_day_id_trip_days_id_fk" FOREIGN KEY ("day_id") REFERENCES "public"."trip_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_items" ADD CONSTRAINT "trip_items_catalogue_entry_id_catalogue_entries_id_fk" FOREIGN KEY ("catalogue_entry_id") REFERENCES "public"."catalogue_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_messages" ADD CONSTRAINT "trip_messages_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_runs" ADD CONSTRAINT "trip_runs_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_travellers" ADD CONSTRAINT "trip_travellers_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_travellers" ADD CONSTRAINT "trip_travellers_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "catalogue_entries_kind_city_id_idx" ON "catalogue_entries" USING btree ("kind","city_id");--> statement-breakpoint
CREATE INDEX "people_user_id_idx" ON "people" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "people_user_id_traveller_unique" ON "people" USING btree ("user_id") WHERE "people"."role" = 'traveller';--> statement-breakpoint
CREATE INDEX "profile_facts_user_id_idx" ON "profile_facts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "trip_days_trip_id_date_unique" ON "trip_days" USING btree ("trip_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "trip_days_trip_id_position_unique" ON "trip_days" USING btree ("trip_id","position");--> statement-breakpoint
CREATE INDEX "trip_gaps_trip_id_idx" ON "trip_gaps" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "trip_items_trip_id_idx" ON "trip_items" USING btree ("trip_id");--> statement-breakpoint
CREATE UNIQUE INDEX "trip_items_day_id_position_unique" ON "trip_items" USING btree ("day_id","position") WHERE "trip_items"."removed_at" is null;--> statement-breakpoint
CREATE INDEX "trip_messages_trip_id_created_at_idx" ON "trip_messages" USING btree ("trip_id","created_at");--> statement-breakpoint
CREATE INDEX "trip_runs_trip_id_created_at_idx" ON "trip_runs" USING btree ("trip_id","created_at");--> statement-breakpoint
CREATE INDEX "trip_travellers_person_id_idx" ON "trip_travellers" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "trips_user_id_idx" ON "trips" USING btree ("user_id");