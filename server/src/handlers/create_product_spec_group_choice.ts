
import { db } from '../db';
import { productSpecGroupChoicesTable } from '../db/schema';
import { type CreateProductSpecGroupChoiceInput, type ProductSpecGroupChoice } from '../schema';

export const createProductSpecGroupChoice = async (input: CreateProductSpecGroupChoiceInput): Promise<ProductSpecGroupChoice> => {
  try {
    // Insert product spec group choice record
    const result = await db.insert(productSpecGroupChoicesTable)
      .values({
        product_spec_group_id: input.product_spec_group_id,
        choice_name: input.choice_name
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Product spec group choice creation failed:', error);
    throw error;
  }
};
