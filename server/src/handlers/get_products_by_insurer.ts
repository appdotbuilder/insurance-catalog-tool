
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type GetProductsByInsurerInput, type Product } from '../schema';
import { eq } from 'drizzle-orm';

export async function getProductsByInsurer(input: GetProductsByInsurerInput): Promise<Product[]> {
  try {
    const results = await db.select()
      .from(productsTable)
      .where(eq(productsTable.insurer_id, input.insurer_id))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get products by insurer:', error);
    throw error;
  }
}
