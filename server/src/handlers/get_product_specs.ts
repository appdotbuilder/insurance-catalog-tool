
import { db } from '../db';
import { productSpecsTable } from '../db/schema';
import { type GetProductSpecsInput, type ProductSpec } from '../schema';

export async function getProductSpecs(input: GetProductSpecsInput): Promise<ProductSpec[]> {
  try {
    // Fetch all product specs - they are not directly linked to products
    // but are used for product comparison and configuration
    const results = await db.select()
      .from(productSpecsTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(spec => ({
      ...spec,
      min_value: spec.min_value !== null ? parseFloat(spec.min_value.toString()) : null,
      max_value: spec.max_value !== null ? parseFloat(spec.max_value.toString()) : null,
    }));
  } catch (error) {
    console.error('Failed to fetch product specs:', error);
    throw error;
  }
}
