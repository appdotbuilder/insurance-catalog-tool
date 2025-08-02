
import { db } from '../db';
import { productSpecGroupChoiceValuesTable } from '../db/schema';
import { type CreateProductSpecGroupChoiceValueInput, type ProductSpecGroupChoiceValue } from '../schema';

export const createProductSpecGroupChoiceValue = async (input: CreateProductSpecGroupChoiceValueInput): Promise<ProductSpecGroupChoiceValue> => {
  try {
    // Insert product spec group choice value record
    const result = await db.insert(productSpecGroupChoiceValuesTable)
      .values({
        product_spec_group_choice_id: input.product_spec_group_choice_id,
        product_spec_id: input.product_spec_id,
        value: input.value
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Product spec group choice value creation failed:', error);
    throw error;
  }
};
