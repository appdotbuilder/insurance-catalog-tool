
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productSpecGroupsTable, productSpecGroupChoicesTable } from '../db/schema';
import { type GetProductSpecGroupChoicesInput } from '../schema';
import { getProductSpecGroupChoices } from '../handlers/get_product_spec_group_choices';

describe('getProductSpecGroupChoices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return choices for a specific group', async () => {
    // Create a product spec group first
    const [group] = await db.insert(productSpecGroupsTable)
      .values({
        name: 'Test Group',
      })
      .returning()
      .execute();

    // Create multiple choices for the group
    await db.insert(productSpecGroupChoicesTable)
      .values([
        {
          product_spec_group_id: group.id,
          choice_name: 'Choice A',
        },
        {
          product_spec_group_id: group.id,
          choice_name: 'Choice B',
        },
        {
          product_spec_group_id: group.id,
          choice_name: 'Choice C',
        },
      ])
      .execute();

    const input: GetProductSpecGroupChoicesInput = {
      group_id: group.id,
    };

    const result = await getProductSpecGroupChoices(input);

    expect(result).toHaveLength(3);
    expect(result[0].product_spec_group_id).toEqual(group.id);
    expect(result[0].choice_name).toEqual('Choice A');
    expect(result[0].id).toBeDefined();
    
    const choiceNames = result.map(choice => choice.choice_name).sort();
    expect(choiceNames).toEqual(['Choice A', 'Choice B', 'Choice C']);
  });

  it('should return empty array for group with no choices', async () => {
    // Create a product spec group with no choices
    const [group] = await db.insert(productSpecGroupsTable)
      .values({
        name: 'Empty Group',
      })
      .returning()
      .execute();

    const input: GetProductSpecGroupChoicesInput = {
      group_id: group.id,
    };

    const result = await getProductSpecGroupChoices(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent group', async () => {
    const input: GetProductSpecGroupChoicesInput = {
      group_id: '00000000-0000-0000-0000-000000000000',
    };

    const result = await getProductSpecGroupChoices(input);

    expect(result).toHaveLength(0);
  });

  it('should not return choices from other groups', async () => {
    // Create two different groups
    const [group1] = await db.insert(productSpecGroupsTable)
      .values({
        name: 'Group 1',
      })
      .returning()
      .execute();

    const [group2] = await db.insert(productSpecGroupsTable)
      .values({
        name: 'Group 2',
      })
      .returning()
      .execute();

    // Add choices to both groups
    await db.insert(productSpecGroupChoicesTable)
      .values([
        {
          product_spec_group_id: group1.id,
          choice_name: 'Group 1 Choice',
        },
        {
          product_spec_group_id: group2.id,
          choice_name: 'Group 2 Choice',
        },
      ])
      .execute();

    const input: GetProductSpecGroupChoicesInput = {
      group_id: group1.id,
    };

    const result = await getProductSpecGroupChoices(input);

    expect(result).toHaveLength(1);
    expect(result[0].choice_name).toEqual('Group 1 Choice');
    expect(result[0].product_spec_group_id).toEqual(group1.id);
  });
});
