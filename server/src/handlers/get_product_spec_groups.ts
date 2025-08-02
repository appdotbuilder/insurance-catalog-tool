
import { db } from '../db';
import { productSpecGroupsTable } from '../db/schema';
import { type ProductSpecGroup } from '../schema';

export const getProductSpecGroups = async (): Promise<ProductSpecGroup[]> => {
  try {
    const results = await db.select()
      .from(productSpecGroupsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get product spec groups:', error);
    throw error;
  }
};
