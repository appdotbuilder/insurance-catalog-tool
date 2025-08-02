
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  productSpecGroupsTable, 
  productSpecsTable, 
  productSpecGroupChoicesTable,
  productSpecGroupChoiceValuesTable
} from '../db/schema';
import { type GetProductSpecGroupChoiceValuesInput } from '../schema';
import { getProductSpecGroupChoiceValues } from '../handlers/get_product_spec_group_choice_values';

describe('getProductSpecGroupChoiceValues', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return values for a specific choice', async () => {
    // Create a product spec group
    const [group] = await db.insert(productSpecGroupsTable)
      .values({ name: 'Test Group' })
      .returning()
      .execute();

    // Create product specs
    const [spec1] = await db.insert(productSpecsTable)
      .values({
        shortname: 'spec1',
        description: 'Test Spec 1',
        default_value: 'default1',
        value_type: 'text',
        min_value: null,
        max_value: null,
        editable: true,
        group_id: group.id
      })
      .returning()
      .execute();

    const [spec2] = await db.insert(productSpecsTable)
      .values({
        shortname: 'spec2',
        description: 'Test Spec 2',
        default_value: 'default2',
        value_type: 'number',
        min_value: 0,
        max_value: 100,
        editable: true,
        group_id: group.id
      })
      .returning()
      .execute();

    // Create a choice
    const [choice] = await db.insert(productSpecGroupChoicesTable)
      .values({
        product_spec_group_id: group.id,
        choice_name: 'Test Choice'
      })
      .returning()
      .execute();

    // Create choice values
    await db.insert(productSpecGroupChoiceValuesTable)
      .values([
        {
          product_spec_group_choice_id: choice.id,
          product_spec_id: spec1.id,
          value: 'custom_value_1'
        },
        {
          product_spec_group_choice_id: choice.id,
          product_spec_id: spec2.id,
          value: '50'
        }
      ])
      .execute();

    const input: GetProductSpecGroupChoiceValuesInput = {
      choice_id: choice.id
    };

    const result = await getProductSpecGroupChoiceValues(input);

    expect(result).toHaveLength(2);
    
    // Sort by product_spec_id for consistent comparison
    const sortedResult = result.sort((a, b) => a.product_spec_id.localeCompare(b.product_spec_id));
    const sortedSpecs = [spec1, spec2].sort((a, b) => a.id.localeCompare(b.id));

    expect(sortedResult[0].product_spec_group_choice_id).toEqual(choice.id);
    expect(sortedResult[0].product_spec_id).toEqual(sortedSpecs[0].id);
    expect(sortedResult[0].value).toEqual(sortedSpecs[0].id === spec1.id ? 'custom_value_1' : '50');

    expect(sortedResult[1].product_spec_group_choice_id).toEqual(choice.id);
    expect(sortedResult[1].product_spec_id).toEqual(sortedSpecs[1].id);
    expect(sortedResult[1].value).toEqual(sortedSpecs[1].id === spec2.id ? '50' : 'custom_value_1');
  });

  it('should return empty array for choice with no values', async () => {
    // Create a product spec group
    const [group] = await db.insert(productSpecGroupsTable)
      .values({ name: 'Test Group' })
      .returning()
      .execute();

    // Create a choice without any values
    const [choice] = await db.insert(productSpecGroupChoicesTable)
      .values({
        product_spec_group_id: group.id,
        choice_name: 'Empty Choice'
      })
      .returning()
      .execute();

    const input: GetProductSpecGroupChoiceValuesInput = {
      choice_id: choice.id
    };

    const result = await getProductSpecGroupChoiceValues(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent choice', async () => {
    const input: GetProductSpecGroupChoiceValuesInput = {
      choice_id: '550e8400-e29b-41d4-a716-446655440000' // Non-existent UUID
    };

    const result = await getProductSpecGroupChoiceValues(input);

    expect(result).toHaveLength(0);
  });

  it('should only return values for the specified choice', async () => {
    // Create a product spec group
    const [group] = await db.insert(productSpecGroupsTable)
      .values({ name: 'Test Group' })
      .returning()
      .execute();

    // Create a product spec
    const [spec] = await db.insert(productSpecsTable)
      .values({
        shortname: 'spec1',
        description: 'Test Spec',
        default_value: 'default',
        value_type: 'text',
        min_value: null,
        max_value: null,
        editable: true,
        group_id: group.id
      })
      .returning()
      .execute();

    // Create two choices
    const [choice1] = await db.insert(productSpecGroupChoicesTable)
      .values({
        product_spec_group_id: group.id,
        choice_name: 'Choice 1'
      })
      .returning()
      .execute();

    const [choice2] = await db.insert(productSpecGroupChoicesTable)
      .values({
        product_spec_group_id: group.id,
        choice_name: 'Choice 2'
      })
      .returning()
      .execute();

    // Create values for both choices
    await db.insert(productSpecGroupChoiceValuesTable)
      .values([
        {
          product_spec_group_choice_id: choice1.id,
          product_spec_id: spec.id,
          value: 'choice1_value'
        },
        {
          product_spec_group_choice_id: choice2.id,
          product_spec_id: spec.id,
          value: 'choice2_value'
        }
      ])
      .execute();

    const input: GetProductSpecGroupChoiceValuesInput = {
      choice_id: choice1.id
    };

    const result = await getProductSpecGroupChoiceValues(input);

    expect(result).toHaveLength(1);
    expect(result[0].product_spec_group_choice_id).toEqual(choice1.id);
    expect(result[0].product_spec_id).toEqual(spec.id);
    expect(result[0].value).toEqual('choice1_value');
  });
});
