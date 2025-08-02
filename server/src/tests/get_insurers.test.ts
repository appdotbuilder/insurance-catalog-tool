
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { insurersTable } from '../db/schema';
import { getInsurers } from '../handlers/get_insurers';

describe('getInsurers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no insurers exist', async () => {
    const result = await getInsurers();

    expect(result).toEqual([]);
  });

  it('should return all insurers', async () => {
    // Create test insurers
    await db.insert(insurersTable)
      .values([
        { name: 'Test Insurer 1' },
        { name: 'Test Insurer 2' },
        { name: 'Test Insurer 3' }
      ])
      .execute();

    const result = await getInsurers();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Test Insurer 1');
    expect(result[1].name).toEqual('Test Insurer 2');
    expect(result[2].name).toEqual('Test Insurer 3');
    
    // Validate that all results have proper structure
    result.forEach(insurer => {
      expect(insurer.id).toBeDefined();
      expect(typeof insurer.id).toBe('string');
      expect(insurer.name).toBeDefined();
      expect(typeof insurer.name).toBe('string');
    });
  });

  it('should return insurers in database order', async () => {
    // Create insurers with specific names to test ordering
    const insurer1 = await db.insert(insurersTable)
      .values({ name: 'Alpha Insurance' })
      .returning()
      .execute();

    const insurer2 = await db.insert(insurersTable)
      .values({ name: 'Beta Insurance' })
      .returning()
      .execute();

    const result = await getInsurers();

    expect(result).toHaveLength(2);
    expect(result[0].id).toEqual(insurer1[0].id);
    expect(result[0].name).toEqual('Alpha Insurance');
    expect(result[1].id).toEqual(insurer2[0].id);
    expect(result[1].name).toEqual('Beta Insurance');
  });
});
