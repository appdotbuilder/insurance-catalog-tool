
import { db } from '../db';
import { productSpecsTable } from '../db/schema';
import { type CreateProductSpecInput, type ProductSpec } from '../schema';

export const createProductSpec = async (input: CreateProductSpecInput): Promise<ProductSpec> => {
  try {
    // Insert product spec record
    const result = await db.insert(productSpecsTable)
      .values({
        shortname: input.shortname,
        description: input.description,
        default_value: input.default_value,
        value_type: input.value_type,
        min_value: input.min_value,
        max_value: input.max_value,
        editable: input.editable,
        group_id: input.group_id,
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const productSpec = result[0];
    return {
      ...productSpec,
      min_value: productSpec.min_value !== null ? parseFloat(productSpec.min_value.toString()) : null,
      max_value: productSpec.max_value !== null ? parseFloat(productSpec.max_value.toString()) : null,
    };
  } catch (error) {
    console.error('Product spec creation failed:', error);
    throw error;
  }
};
