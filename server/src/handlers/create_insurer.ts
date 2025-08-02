
import { db } from '../db';
import { insurersTable } from '../db/schema';
import { type CreateInsurerInput, type Insurer } from '../schema';

export const createInsurer = async (input: CreateInsurerInput): Promise<Insurer> => {
  try {
    // Insert insurer record
    const result = await db.insert(insurersTable)
      .values({
        name: input.name,
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Insurer creation failed:', error);
    throw error;
  }
};
