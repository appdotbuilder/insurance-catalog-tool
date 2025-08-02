
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { insurersTable } from '../db/schema';
import { type CreateInsurerInput } from '../schema';
import { createInsurer } from '../handlers/create_insurer';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateInsurerInput = {
  name: 'Test Insurance Company'
};

describe('createInsurer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an insurer', async () => {
    const result = await createInsurer(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Insurance Company');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('string');
    expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('should save insurer to database', async () => {
    const result = await createInsurer(testInput);

    // Query using proper drizzle syntax
    const insurers = await db.select()
      .from(insurersTable)
      .where(eq(insurersTable.id, result.id))
      .execute();

    expect(insurers).toHaveLength(1);
    expect(insurers[0].name).toEqual('Test Insurance Company');
    expect(insurers[0].id).toEqual(result.id);
  });

  it('should handle different insurer names', async () => {
    const inputs = [
      { name: 'ABC Insurance' },
      { name: 'XYZ Life Insurance Co.' },
      { name: 'Global Health Insurance Ltd.' }
    ];

    for (const input of inputs) {
      const result = await createInsurer(input);
      expect(result.name).toEqual(input.name);
      expect(result.id).toBeDefined();
    }

    // Verify all insurers were created
    const allInsurers = await db.select().from(insurersTable).execute();
    expect(allInsurers).toHaveLength(3);
  });
});
