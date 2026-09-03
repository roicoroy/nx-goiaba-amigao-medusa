import { Migration } from '@mikro-orm/migrations';

export class Migration20250918000000 extends Migration {

  override async up(): Promise<void> {
    // Add variant_id column to product_review table
    this.addSql(`ALTER TABLE "product_review" ADD COLUMN IF NOT EXISTS "variant_id" text NULL;`);

    // Add index for variant_id
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_review_variant_id" ON "product_review" (variant_id) WHERE deleted_at IS NULL;`);

    // Change average_rating from INTEGER to NUMERIC/DECIMAL for decimal precision
    // First, we need to alter the column type
    this.addSql(`
      ALTER TABLE "product_review_stats"
      ALTER COLUMN "average_rating"
      TYPE NUMERIC(10, 2)
      USING average_rating::numeric(10, 2);
    `);
  }

  override async down(): Promise<void> {
    // Remove variant_id index
    this.addSql(`DROP INDEX IF EXISTS "IDX_product_review_variant_id";`);

    // Remove variant_id column
    this.addSql(`ALTER TABLE "product_review" DROP COLUMN IF EXISTS "variant_id";`);

    // Revert average_rating back to INTEGER
    this.addSql(`
      ALTER TABLE "product_review_stats"
      ALTER COLUMN "average_rating"
      TYPE INTEGER
      USING ROUND(average_rating)::integer;
    `);
  }

}