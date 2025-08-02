
import { db } from '../db';
import { productSpecGroupChoicesTable } from '../db/schema';
import { type GetProductSpecGroupChoicesInput, type ProductSpecGroupChoice } from '../schema';
import { eq } from 'drizzle-orm';

export async function getProductSpecGroupChoices(input: GetProductSpecGroupChoicesInput): Promise<ProductSpecGroupChoice[]> {
  try {
    const results = await db.select()
      .from(productSpecGroupChoicesTable)
      .where(eq(productSpecGroupChoicesTable.product_spec_group_id, input.group_id))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch product spec group choices:', error);
    throw error;
  }
}
