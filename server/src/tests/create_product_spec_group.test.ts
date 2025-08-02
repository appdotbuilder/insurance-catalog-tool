
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productSpecGroupsTable } from '../db/schema';
import { type CreateProductSpecGroupInput } from '../schema';
import { createProductSpecGroup } from '../handlers/create_product_spec_group';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateProductSpecGroupInput = {
  name: 'Test Product Spec Group'
};

describe('createProductSpecGroup', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a product spec group', async () => {
    const result = await createProductSpecGroup(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Product Spec Group');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('string');
  });

  it('should save product spec group to database', async () => {
    const result = await createProductSpecGroup(testInput);

    // Query using proper drizzle syntax
    const productSpecGroups = await db.select()
      .from(productSpecGroupsTable)
      .where(eq(productSpecGroupsTable.id, result.id))
      .execute();

    expect(productSpecGroups).toHaveLength(1);
    expect(productSpecGroups[0].name).toEqual('Test Product Spec Group');
    expect(productSpecGroups[0].id).toEqual(result.id);
  });

  it('should create multiple product spec groups with different names', async () => {
    const firstGroup = await createProductSpecGroup({ name: 'Coverage Options' });
    const secondGroup = await createProductSpecGroup({ name: 'Premium Features' });

    // Verify both groups exist
    const allGroups = await db.select()
      .from(productSpecGroupsTable)
      .execute();

    expect(allGroups).toHaveLength(2);
    
    const groupNames = allGroups.map(g => g.name).sort();
    expect(groupNames).toEqual(['Coverage Options', 'Premium Features']);
    
    expect(firstGroup.id).not.toEqual(secondGroup.id);
  });
});
