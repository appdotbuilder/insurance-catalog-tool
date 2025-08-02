
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { insurersTable, productsTable, productSpecsTable, productSpecGroupsTable } from '../db/schema';
import { type GetProductSpecsInput } from '../schema';
import { getProductSpecs } from '../handlers/get_product_specs';

describe('getProductSpecs', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no product specs exist', async () => {
    // Create test insurer and product first
    const insurer = await db.insert(insurersTable)
      .values({ name: 'Test Insurer' })
      .returning()
      .execute();

    const product = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        insurer_id: insurer[0].id,
        spsolution: true,
        active: true
      })
      .returning()
      .execute();

    const input: GetProductSpecsInput = {
      product_id: product[0].id
    };

    const result = await getProductSpecs(input);

    expect(result).toEqual([]);
  });

  it('should return all product specs', async () => {
    // Create test insurer and product
    const insurer = await db.insert(insurersTable)
      .values({ name: 'Test Insurer' })
      .returning()
      .execute();

    const product = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        insurer_id: insurer[0].id,
        spsolution: true,
        active: true
      })
      .returning()
      .execute();

    // Create test product spec group
    const group = await db.insert(productSpecGroupsTable)
      .values({ name: 'Test Group' })
      .returning()
      .execute();

    // Create test product specs
    await db.insert(productSpecsTable)
      .values([
        {
          shortname: 'PREMIUM',
          description: 'Monthly Premium',
          default_value: '100',
          value_type: 'number',
          min_value: 50,
          max_value: 500,
          editable: true,
          group_id: group[0].id
        },
        {
          shortname: 'COVERAGE',
          description: 'Coverage Amount',
          default_value: '1000000',
          value_type: 'number',
          min_value: null,
          max_value: null,
          editable: false,
          group_id: null
        }
      ])
      .execute();

    const input: GetProductSpecsInput = {
      product_id: product[0].id
    };

    const result = await getProductSpecs(input);

    expect(result).toHaveLength(2);
    
    // Check first spec
    const premiumSpec = result.find(spec => spec.shortname === 'PREMIUM');
    expect(premiumSpec).toBeDefined();
    expect(premiumSpec!.description).toEqual('Monthly Premium');
    expect(premiumSpec!.default_value).toEqual('100');
    expect(premiumSpec!.value_type).toEqual('number');
    expect(typeof premiumSpec!.min_value).toBe('number');
    expect(premiumSpec!.min_value).toEqual(50);
    expect(typeof premiumSpec!.max_value).toBe('number');
    expect(premiumSpec!.max_value).toEqual(500);
    expect(premiumSpec!.editable).toBe(true);
    expect(premiumSpec!.group_id).toEqual(group[0].id);

    // Check second spec
    const coverageSpec = result.find(spec => spec.shortname === 'COVERAGE');
    expect(coverageSpec).toBeDefined();
    expect(coverageSpec!.description).toEqual('Coverage Amount');
    expect(coverageSpec!.default_value).toEqual('1000000');
    expect(coverageSpec!.value_type).toEqual('number');
    expect(coverageSpec!.min_value).toBeNull();
    expect(coverageSpec!.max_value).toBeNull();
    expect(coverageSpec!.editable).toBe(false);
    expect(coverageSpec!.group_id).toBeNull();
  });

  it('should handle different value types correctly', async () => {
    // Create test insurer and product
    const insurer = await db.insert(insurersTable)
      .values({ name: 'Test Insurer' })
      .returning()
      .execute();

    const product = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        insurer_id: insurer[0].id,
        spsolution: true,
        active: true
      })
      .returning()
      .execute();

    // Create product specs with different value types
    await db.insert(productSpecsTable)
      .values([
        {
          shortname: 'NAME',
          description: 'Product Name',
          default_value: 'Default Name',
          value_type: 'text',
          min_value: null,
          max_value: null,
          editable: true,
          group_id: null
        },
        {
          shortname: 'DISCOUNT',
          description: 'Discount Rate',
          default_value: '10',
          value_type: 'percentage',
          min_value: 0,
          max_value: 100,
          editable: true,
          group_id: null
        }
      ])
      .execute();

    const input: GetProductSpecsInput = {
      product_id: product[0].id
    };

    const result = await getProductSpecs(input);

    expect(result).toHaveLength(2);

    const textSpec = result.find(spec => spec.value_type === 'text');
    expect(textSpec).toBeDefined();
    expect(textSpec!.shortname).toEqual('NAME');
    expect(textSpec!.default_value).toEqual('Default Name');

    const percentageSpec = result.find(spec => spec.value_type === 'percentage');
    expect(percentageSpec).toBeDefined();
    expect(percentageSpec!.shortname).toEqual('DISCOUNT');
    expect(typeof percentageSpec!.min_value).toBe('number');
    expect(percentageSpec!.min_value).toEqual(0);
    expect(typeof percentageSpec!.max_value).toBe('number');
    expect(percentageSpec!.max_value).toEqual(100);
  });
});
