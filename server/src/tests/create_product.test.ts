
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, insurersTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

describe('createProduct', () => {
  let insurerId: string;

  beforeEach(async () => {
    await createDB();
    
    // Create prerequisite insurer
    const insurerResult = await db.insert(insurersTable)
      .values({
        name: 'Test Insurer'
      })
      .returning()
      .execute();
    
    insurerId = insurerResult[0].id;
  });

  afterEach(resetDB);

  it('should create a product', async () => {
    const testInput: CreateProductInput = {
      name: 'Test Product',
      insurer_id: insurerId,
      spsolution: true,
      active: true
    };

    const result = await createProduct(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Product');
    expect(result.insurer_id).toEqual(insurerId);
    expect(result.spsolution).toEqual(true);
    expect(result.active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('string');
  });

  it('should save product to database', async () => {
    const testInput: CreateProductInput = {
      name: 'Database Test Product',
      insurer_id: insurerId,
      spsolution: false,
      active: true
    };

    const result = await createProduct(testInput);

    // Query using proper drizzle syntax
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].name).toEqual('Database Test Product');
    expect(products[0].insurer_id).toEqual(insurerId);
    expect(products[0].spsolution).toEqual(false);
    expect(products[0].active).toEqual(true);
  });

  it('should handle boolean values correctly', async () => {
    const testInput: CreateProductInput = {
      name: 'Boolean Test Product',
      insurer_id: insurerId,
      spsolution: false,
      active: false
    };

    const result = await createProduct(testInput);

    expect(result.spsolution).toEqual(false);
    expect(result.active).toEqual(false);

    // Verify in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products[0].spsolution).toEqual(false);
    expect(products[0].active).toEqual(false);
  });

  it('should throw error for invalid insurer_id', async () => {
    const testInput: CreateProductInput = {
      name: 'Invalid Insurer Product',
      insurer_id: '00000000-0000-0000-0000-000000000000', // Non-existent insurer
      spsolution: true,
      active: true
    };

    await expect(createProduct(testInput)).rejects.toThrow(/foreign key constraint/i);
  });
});
