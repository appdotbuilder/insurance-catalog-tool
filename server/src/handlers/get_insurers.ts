
import { db } from '../db';
import { insurersTable } from '../db/schema';
import { type Insurer } from '../schema';

export const getInsurers = async (): Promise<Insurer[]> => {
  try {
    const results = await db.select()
      .from(insurersTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Get insurers failed:', error);
    throw error;
  }
};
