
import { db } from '../db';
import { productSpecGroupsTable } from '../db/schema';
import { type CreateProductSpecGroupInput, type ProductSpecGroup } from '../schema';

export const createProductSpecGroup = async (input: CreateProductSpecGroupInput): Promise<ProductSpecGroup> => {
  try {
    // Insert product spec group record
    const result = await db.insert(productSpecGroupsTable)
      .values({
        name: input.name
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Product spec group creation failed:', error);
    throw error;
  }
};
