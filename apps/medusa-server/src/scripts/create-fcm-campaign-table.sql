CREATE TABLE IF NOT EXISTS "fcm_campaign" (
  "id" text not null,
  "title" text not null,
  "body" text not null,
  "data" jsonb null,
  "send_to_all" boolean not null,
  "device_ids" jsonb null,
  "device_count" integer not null,
  "success_count" integer not null,
  "failed_count" integer not null,
  "results" jsonb null,
  "sent_by" text null,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "deleted_at" timestamptz null,
  constraint "fcm_campaign_pkey" primary key ("id")
);

CREATE INDEX IF NOT EXISTS "IDX_fcm_campaign_deleted_at" ON "fcm_campaign" ("deleted_at") WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS "IDX_fcm_campaign_created_at" ON "fcm_campaign" ("created_at") WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS "IDX_fcm_campaign_sent_by" ON "fcm_campaign" ("sent_by") WHERE deleted_at IS NULL;

