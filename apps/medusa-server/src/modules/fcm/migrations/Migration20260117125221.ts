import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260117125221 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "fcm_device_token" drop constraint if exists "fcm_device_token_token_unique";`);
    this.addSql(`create table if not exists "fcm_campaign" ("id" text not null, "title" text not null, "body" text not null, "data" jsonb null, "send_to_all" boolean not null, "device_ids" jsonb null, "device_count" integer not null, "success_count" integer not null, "failed_count" integer not null, "results" jsonb null, "sent_by" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fcm_campaign_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fcm_campaign_deleted_at" ON "fcm_campaign" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fcm_campaign_created_at" ON "fcm_campaign" ("created_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fcm_campaign_sent_by" ON "fcm_campaign" ("sent_by") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "fcm_device_token" ("id" text not null, "token" text not null, "platform" text check ("platform" in ('ios', 'android', 'web')) not null, "app_version" text null, "device_info" jsonb null, "customer_id" text null, "user_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "fcm_device_token_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fcm_device_token_deleted_at" ON "fcm_device_token" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_fcm_device_token_token_unique" ON "fcm_device_token" ("token") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fcm_device_token_customer_id" ON "fcm_device_token" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_fcm_device_token_platform" ON "fcm_device_token" ("platform") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "fcm_campaign" cascade;`);

    this.addSql(`drop table if exists "fcm_device_token" cascade;`);
  }

}
