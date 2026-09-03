import { Migration } from '@mikro-orm/migrations';

export class Migration20250928211344 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_review" add column if not exists "variant_id" text null, add column if not exists "verified" boolean not null default false;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_review_variant_id" ON "product_review" (variant_id) WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "product_review_image" add column if not exists "type" text not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_product_review_variant_id";`);
    this.addSql(`alter table if exists "product_review" drop column if exists "variant_id", drop column if exists "verified";`);

    this.addSql(`alter table if exists "product_review_image" drop column if exists "type";`);
  }

}
