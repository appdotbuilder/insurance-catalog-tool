
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { insurersTable, productsTable } from '../db/schema';
import { type GetProductsByInsurerInput } from '../schema';
import { getProductsByInsurer } from '../handlers/get_products_by_insurer';

describe('getProductsByInsurer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return products for a specific insurer', async () => {
    // Create test insurer
    const insurerResult = await db.insert(insurersTable)
      .values({ name: 'Test Insurance Co' })
      .returning()
      .execute();
    const insurer = insurerResult[0];

    // Create test products for this insurer
    await db.insert(productsTable)
      .values([
        {
          name: 'Health Plan A',
          insurer_id: insurer.id,
          spsolution: true,
          active: true
        },
        {
          name: 'Life Insurance Premium',
          insurer_id: insurer.id,
          spsolution: false,
          active: true
        }
      ])
      .execute();

    const input: GetProductsByInsurerInput = {
      insurer_id: insurer.id
    };

    const result = await getProductsByInsurer(input);

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Health Plan A');
    expect(result[0].insurer_id).toEqual(insurer.id);
    expect(result[0].spsolution).toBe(true);
    expect(result[0].active).toBe(true);
    expect(result[0].id).toBeDefined();

    expect(result[1].name).toEqual('Life Insurance Premium');
    expect(result[1].insurer_id).toEqual(insurer.id);
    expect(result[1].spsolution).toBe(false);
    expect(result[1].active).toBe(true);
  });

  it('should return empty array when insurer has no products', async () => {
    // Create test insurer with no products
    const insurerResult = await db.insert(insurersTable)
      .values({ name: 'Empty Insurer' })
      .returning()
      .execute();
    const insurer = insurerResult[0];

    const input: GetProductsByInsurerInput = {
      insurer_id: insurer.id
    };

    const result = await getProductsByInsurer(input);

    expect(result).toHaveLength(0);
  });

  it('should only return products for the specified insurer', async () => {
    // Create two insurers
    const insurerResults = await db.insert(insurersTable)
      .values([
        { name: 'Insurer One' },
        { name: 'Insurer Two' }
      ])
      .returning()
      .execute();
    const [insurer1, insurer2] = insurerResults;

    // Create products for both insurers
    await db.insert(productsTable)
      .values([
        {
          name: 'Product A',
          insurer_id: insurer1.id,
          spsolution: true,
          active: true
        },
        {
          name: 'Product B',
          insurer_id: insurer1.id,
          spsolution: false,
          active: true
        },
        {
          name: 'Product C',
          insurer_id: insurer2.id,
          spsolution: true,
          active: false
        }
      ])
      .execute();

    const input: GetProductsByInsurerInput = {
      insurer_id: insurer1.id
    };

    const result = await getProductsByInsurer(input);

    expect(result).toHaveLength(2);
    result.forEach(product => {
      expect(product.insurer_id).toEqual(insurer1.id);
    });

    const productNames = result.map(p => p.name);
    expect(productNames).toContain('Product A');
    expect(productNames).toContain('Product B');
    expect(productNames).not.toContain('Product C');
  });

  it('should return both active and inactive products', async () => {
    // Create test insurer
    const insurerResult = await db.insert(insurersTable)
      .values({ name: 'Mixed Products Insurer' })
      .returning()
      .execute();
    const insurer = insurerResult[0];

    // Create active and inactive products
    await db.insert(productsTable)
      .values([
        {
          name: 'Active Product',
          insurer_id: insurer.id,
          spsolution: true,
          active: true
        },
        {
          name: 'Inactive Product',
          insurer_id: insurer.id,
          spsolution: false,
          active: false
        }
      ])
      .execute();

    const input: GetProductsByInsurerInput = {
      insurer_id: insurer.id
    };

    const result = await getProductsByInsurer(input);

    expect(result).toHaveLength(2);
    
    const activeProduct = result.find(p => p.name === 'Active Product');
    const inactiveProduct = result.find(p => p.name === 'Inactive Product');
    
    expect(activeProduct?.active).toBe(true);
    expect(inactiveProduct?.active).toBe(false);
  });

  it('should return empty array for non-existent insurer', async () => {
    const input: GetProductsByInsurerInput = {
      insurer_id: '550e8400-e29b-41d4-a716-446655440000' // Random UUID
    };

    const result = await getProductsByInsurer(input);

    expect(result).toHaveLength(0);
  });
});
