
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput, type Product } from '../schema';

export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  try {
    // Insert product record
    const result = await db.insert(productsTable)
      .values({
        name: input.name,
        insurer_id: input.insurer_id,
        spsolution: input.spsolution,
        active: input.active
      })
      .returning()
      .execute();

    const product = result[0];
    return product;
  } catch (error) {
    console.error('Product creation failed:', error);
    throw error;
  }
};
