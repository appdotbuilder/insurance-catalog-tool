
import { db } from '../db';
import { productSpecGroupChoiceValuesTable } from '../db/schema';
import { type GetProductSpecGroupChoiceValuesInput, type ProductSpecGroupChoiceValue } from '../schema';
import { eq } from 'drizzle-orm';

export async function getProductSpecGroupChoiceValues(input: GetProductSpecGroupChoiceValuesInput): Promise<ProductSpecGroupChoiceValue[]> {
  try {
    const results = await db.select()
      .from(productSpecGroupChoiceValuesTable)
      .where(eq(productSpecGroupChoiceValuesTable.product_spec_group_choice_id, input.choice_id))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get product spec group choice values:', error);
    throw error;
  }
}
