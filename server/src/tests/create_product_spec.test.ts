
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productSpecsTable, productSpecGroupsTable } from '../db/schema';
import { type CreateProductSpecInput } from '../schema';
import { createProductSpec } from '../handlers/create_product_spec';
import { eq } from 'drizzle-orm';

// Test input without group
const testInputWithoutGroup: CreateProductSpecInput = {
  shortname: 'TEST_SPEC',
  description: 'A test product specification',
  default_value: '100',
  value_type: 'number',
  min_value: 0,
  max_value: 1000,
  editable: true,
  group_id: null,
};

// Test input with group (will be set after creating group)
let testInputWithGroup: CreateProductSpecInput;

describe('createProductSpec', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a product spec without group', async () => {
    const result = await createProductSpec(testInputWithoutGroup);

    // Basic field validation
    expect(result.shortname).toEqual('TEST_SPEC');
    expect(result.description).toEqual('A test product specification');
    expect(result.default_value).toEqual('100');
    expect(result.value_type).toEqual('number');
    expect(result.min_value).toEqual(0);
    expect(result.max_value).toEqual(1000);
    expect(result.editable).toEqual(true);
    expect(result.group_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.min_value).toBe('number');
    expect(typeof result.max_value).toBe('number');
  });

  it('should create a product spec with group', async () => {
    // Create a product spec group first
    const groupResult = await db.insert(productSpecGroupsTable)
      .values({
        name: 'Test Group',
      })
      .returning()
      .execute();

    const groupId = groupResult[0].id;

    testInputWithGroup = {
      ...testInputWithoutGroup,
      group_id: groupId,
    };

    const result = await createProductSpec(testInputWithGroup);

    // Basic field validation
    expect(result.shortname).toEqual('TEST_SPEC');
    expect(result.group_id).toEqual(groupId);
    expect(result.id).toBeDefined();
  });

  it('should save product spec to database', async () => {
    const result = await createProductSpec(testInputWithoutGroup);

    // Query using proper drizzle syntax
    const productSpecs = await db.select()
      .from(productSpecsTable)
      .where(eq(productSpecsTable.id, result.id))
      .execute();

    expect(productSpecs).toHaveLength(1);
    expect(productSpecs[0].shortname).toEqual('TEST_SPEC');
    expect(productSpecs[0].description).toEqual('A test product specification');
    expect(productSpecs[0].default_value).toEqual('100');
    expect(productSpecs[0].value_type).toEqual('number');
    expect(productSpecs[0].editable).toEqual(true);
    expect(productSpecs[0].group_id).toBeNull();
  });

  it('should handle text value type correctly', async () => {
    const textInput: CreateProductSpecInput = {
      shortname: 'TEXT_SPEC',
      description: 'A text specification',
      default_value: 'default text',
      value_type: 'text',
      min_value: null,
      max_value: null,
      editable: false,
      group_id: null,
    };

    const result = await createProductSpec(textInput);

    expect(result.value_type).toEqual('text');
    expect(result.min_value).toBeNull();
    expect(result.max_value).toBeNull();
    expect(result.editable).toEqual(false);
  });

  it('should handle percentage value type correctly', async () => {
    const percentageInput: CreateProductSpecInput = {
      shortname: 'PCT_SPEC',
      description: 'A percentage specification',
      default_value: '50',
      value_type: 'percentage',
      min_value: 0,
      max_value: 100,
      editable: true,
      group_id: null,
    };

    const result = await createProductSpec(percentageInput);

    expect(result.value_type).toEqual('percentage');
    expect(result.min_value).toEqual(0);
    expect(result.max_value).toEqual(100);
    expect(typeof result.min_value).toBe('number');
    expect(typeof result.max_value).toBe('number');
  });
});
