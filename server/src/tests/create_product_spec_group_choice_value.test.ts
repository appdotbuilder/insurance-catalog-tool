
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { insurersTable, productsTable, productSpecGroupsTable, productSpecsTable, productSpecGroupChoicesTable, productSpecGroupChoiceValuesTable } from '../db/schema';
import { type CreateProductSpecGroupChoiceValueInput } from '../schema';
import { createProductSpecGroupChoiceValue } from '../handlers/create_product_spec_group_choice_value';
import { eq } from 'drizzle-orm';

describe('createProductSpecGroupChoiceValue', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a product spec group choice value', async () => {
    // Create prerequisites: insurer, product, spec group, spec, and choice
    const insurerResult = await db.insert(insurersTable)
      .values({ name: 'Test Insurer' })
      .returning()
      .execute();
    const insurer = insurerResult[0];

    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        insurer_id: insurer.id,
        spsolution: true,
        active: true
      })
      .returning()
      .execute();

    const specGroupResult = await db.insert(productSpecGroupsTable)
      .values({ name: 'Test Spec Group' })
      .returning()
      .execute();
    const specGroup = specGroupResult[0];

    const specResult = await db.insert(productSpecsTable)
      .values({
        shortname: 'test_spec',
        description: 'Test Product Spec',
        default_value: '100',
        value_type: 'number',
        min_value: 0,
        max_value: 1000,
        editable: true,
        group_id: specGroup.id
      })
      .returning()
      .execute();
    const spec = specResult[0];

    const choiceResult = await db.insert(productSpecGroupChoicesTable)
      .values({
        product_spec_group_id: specGroup.id,
        choice_name: 'Test Choice'
      })
      .returning()
      .execute();
    const choice = choiceResult[0];

    const testInput: CreateProductSpecGroupChoiceValueInput = {
      product_spec_group_choice_id: choice.id,
      product_spec_id: spec.id,
      value: '250'
    };

    const result = await createProductSpecGroupChoiceValue(testInput);

    // Basic field validation
    expect(result.product_spec_group_choice_id).toEqual(choice.id);
    expect(result.product_spec_id).toEqual(spec.id);
    expect(result.value).toEqual('250');
  });

  it('should save product spec group choice value to database', async () => {
    // Create prerequisites
    const insurerResult = await db.insert(insurersTable)
      .values({ name: 'Test Insurer' })
      .returning()
      .execute();
    const insurer = insurerResult[0];

    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        insurer_id: insurer.id,
        spsolution: true,
        active: true
      })
      .returning()
      .execute();

    const specGroupResult = await db.insert(productSpecGroupsTable)
      .values({ name: 'Test Spec Group' })
      .returning()
      .execute();
    const specGroup = specGroupResult[0];

    const specResult = await db.insert(productSpecsTable)
      .values({
        shortname: 'test_spec',
        description: 'Test Product Spec',
        default_value: '100',
        value_type: 'text',
        min_value: null,
        max_value: null,
        editable: true,
        group_id: specGroup.id
      })
      .returning()
      .execute();
    const spec = specResult[0];

    const choiceResult = await db.insert(productSpecGroupChoicesTable)
      .values({
        product_spec_group_id: specGroup.id,
        choice_name: 'Test Choice'
      })
      .returning()
      .execute();
    const choice = choiceResult[0];

    const testInput: CreateProductSpecGroupChoiceValueInput = {
      product_spec_group_choice_id: choice.id,
      product_spec_id: spec.id,
      value: 'Custom Value'
    };

    const result = await createProductSpecGroupChoiceValue(testInput);

    // Query database to verify persistence
    const choiceValues = await db.select()
      .from(productSpecGroupChoiceValuesTable)
      .where(eq(productSpecGroupChoiceValuesTable.product_spec_group_choice_id, choice.id))
      .execute();

    expect(choiceValues).toHaveLength(1);
    expect(choiceValues[0].product_spec_group_choice_id).toEqual(choice.id);
    expect(choiceValues[0].product_spec_id).toEqual(spec.id);
    expect(choiceValues[0].value).toEqual('Custom Value');
  });

  it('should handle percentage value type correctly', async () => {
    // Create prerequisites with percentage type spec
    const insurerResult = await db.insert(insurersTable)
      .values({ name: 'Test Insurer' })
      .returning()
      .execute();
    const insurer = insurerResult[0];

    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        insurer_id: insurer.id,
        spsolution: false,
        active: true
      })
      .returning()
      .execute();

    const specGroupResult = await db.insert(productSpecGroupsTable)
      .values({ name: 'Percentage Group' })
      .returning()
      .execute();
    const specGroup = specGroupResult[0];

    const specResult = await db.insert(productSpecsTable)
      .values({
        shortname: 'percentage_spec',
        description: 'Percentage Product Spec',
        default_value: '50%',
        value_type: 'percentage',
        min_value: 0,
        max_value: 100,
        editable: false,
        group_id: specGroup.id
      })
      .returning()
      .execute();
    const spec = specResult[0];

    const choiceResult = await db.insert(productSpecGroupChoicesTable)
      .values({
        product_spec_group_id: specGroup.id,
        choice_name: 'High Coverage'
      })
      .returning()
      .execute();
    const choice = choiceResult[0];

    const testInput: CreateProductSpecGroupChoiceValueInput = {
      product_spec_group_choice_id: choice.id,
      product_spec_id: spec.id,
      value: '85%'
    };

    const result = await createProductSpecGroupChoiceValue(testInput);

    expect(result.value).toEqual('85%');
    expect(result.product_spec_group_choice_id).toEqual(choice.id);
    expect(result.product_spec_id).toEqual(spec.id);
  });
});
