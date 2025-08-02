
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productSpecGroupsTable } from '../db/schema';
import { getProductSpecGroups } from '../handlers/get_product_spec_groups';

describe('getProductSpecGroups', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no product spec groups exist', async () => {
    const result = await getProductSpecGroups();

    expect(result).toEqual([]);
  });

  it('should return all product spec groups', async () => {
    // Create test data
    await db.insert(productSpecGroupsTable)
      .values([
        { name: 'Coverage Options' },
        { name: 'Payment Terms' },
        { name: 'Policy Features' }
      ])
      .execute();

    const result = await getProductSpecGroups();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Coverage Options');
    expect(result[0].id).toBeDefined();
    expect(result[1].name).toEqual('Payment Terms');
    expect(result[1].id).toBeDefined();
    expect(result[2].name).toEqual('Policy Features');
    expect(result[2].id).toBeDefined();
  });

  it('should return groups in insertion order', async () => {
    // Create test data with specific names to verify order
    await db.insert(productSpecGroupsTable)
      .values([
        { name: 'Alpha Group' },
        { name: 'Beta Group' },
        { name: 'Gamma Group' }
      ])
      .execute();

    const result = await getProductSpecGroups();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Alpha Group');
    expect(result[1].name).toEqual('Beta Group');
    expect(result[2].name).toEqual('Gamma Group');
  });
});
