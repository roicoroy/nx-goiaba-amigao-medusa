import { Migration } from '@mikro-orm/migrations';

export class Migration20251102015654 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_review" add column if not exists "title" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product_review" drop column if exists "title";`);
  }

}
