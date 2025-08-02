
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productSpecGroupsTable, productSpecGroupChoicesTable } from '../db/schema';
import { type CreateProductSpecGroupChoiceInput } from '../schema';
import { createProductSpecGroupChoice } from '../handlers/create_product_spec_group_choice';
import { eq } from 'drizzle-orm';

describe('createProductSpecGroupChoice', () => {
  let testGroupId: string;

  beforeEach(async () => {
    await createDB();
    
    // Create prerequisite product spec group
    const groupResult = await db.insert(productSpecGroupsTable)
      .values({
        name: 'Test Product Spec Group'
      })
      .returning()
      .execute();
    
    testGroupId = groupResult[0].id;
  });

  afterEach(resetDB);

  const testInput: CreateProductSpecGroupChoiceInput = {
    product_spec_group_id: '', // Will be set in each test
    choice_name: 'Standard Package'
  };

  it('should create a product spec group choice', async () => {
    const input = { ...testInput, product_spec_group_id: testGroupId };
    
    const result = await createProductSpecGroupChoice(input);

    // Basic field validation
    expect(result.product_spec_group_id).toEqual(testGroupId);
    expect(result.choice_name).toEqual('Standard Package');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('string');
  });

  it('should save product spec group choice to database', async () => {
    const input = { ...testInput, product_spec_group_id: testGroupId };
    
    const result = await createProductSpecGroupChoice(input);

    // Query using proper drizzle syntax
    const choices = await db.select()
      .from(productSpecGroupChoicesTable)
      .where(eq(productSpecGroupChoicesTable.id, result.id))
      .execute();

    expect(choices).toHaveLength(1);
    expect(choices[0].product_spec_group_id).toEqual(testGroupId);
    expect(choices[0].choice_name).toEqual('Standard Package');
    expect(choices[0].id).toEqual(result.id);
  });

  it('should reject invalid product_spec_group_id', async () => {
    const input = { 
      ...testInput, 
      product_spec_group_id: '00000000-0000-0000-0000-000000000000' 
    };

    await expect(createProductSpecGroupChoice(input))
      .rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should create multiple choices for same group', async () => {
    const input1 = { ...testInput, product_spec_group_id: testGroupId, choice_name: 'Basic Package' };
    const input2 = { ...testInput, product_spec_group_id: testGroupId, choice_name: 'Premium Package' };

    const result1 = await createProductSpecGroupChoice(input1);
    const result2 = await createProductSpecGroupChoice(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.choice_name).toEqual('Basic Package');
    expect(result2.choice_name).toEqual('Premium Package');
    expect(result1.product_spec_group_id).toEqual(testGroupId);
    expect(result2.product_spec_group_id).toEqual(testGroupId);

    // Verify both exist in database
    const choices = await db.select()
      .from(productSpecGroupChoicesTable)
      .where(eq(productSpecGroupChoicesTable.product_spec_group_id, testGroupId))
      .execute();

    expect(choices).toHaveLength(2);
  });
});
