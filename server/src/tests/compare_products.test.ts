
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { insurersTable, productsTable, productSpecsTable, productSpecGroupsTable } from '../db/schema';
import { type CompareProductsInput } from '../schema';
import { compareProducts } from '../handlers/compare_products';

describe('compareProducts', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should return empty array when no products match', async () => {
        const input: CompareProductsInput = {
            product_ids: ['550e8400-e29b-41d4-a716-446655440000']
        };

        const result = await compareProducts(input);
        expect(result).toEqual([]);
    });

    it('should return comparison data for single product', async () => {
        // Create prerequisite data
        const [insurer] = await db.insert(insurersTable)
            .values({ name: 'Test Insurer' })
            .returning()
            .execute();

        const [product] = await db.insert(productsTable)
            .values({
                name: 'Test Product',
                insurer_id: insurer.id,
                spsolution: true,
                active: true
            })
            .returning()
            .execute();

        const [group] = await db.insert(productSpecGroupsTable)
            .values({ name: 'Test Group' })
            .returning()
            .execute();

        await db.insert(productSpecsTable)
            .values({
                shortname: 'COVERAGE',
                description: 'Coverage Amount',
                default_value: '100000',
                value_type: 'number',
                min_value: 50000,
                max_value: 500000,
                editable: true,
                group_id: group.id
            })
            .execute();

        const input: CompareProductsInput = {
            product_ids: [product.id]
        };

        const result = await compareProducts(input);

        expect(result).toHaveLength(1);
        expect(result[0].product_id).toEqual(product.id);
        expect(result[0].product_name).toEqual('Test Product');
        expect(result[0].specs).toHaveLength(1);
        expect(result[0].specs[0].shortname).toEqual('COVERAGE');
        expect(result[0].specs[0].description).toEqual('Coverage Amount');
        expect(result[0].specs[0].value_type).toEqual('number');
        expect(typeof result[0].specs[0].min_value).toBe('number');
        expect(result[0].specs[0].min_value).toEqual(50000);
        expect(typeof result[0].specs[0].max_value).toBe('number');
        expect(result[0].specs[0].max_value).toEqual(500000);
        expect(result[0].specs[0].editable).toBe(true);
    });

    it('should return comparison data for multiple products', async () => {
        // Create prerequisite data
        const [insurer] = await db.insert(insurersTable)
            .values({ name: 'Test Insurer' })
            .returning()
            .execute();

        const products = await db.insert(productsTable)
            .values([
                {
                    name: 'Product A',
                    insurer_id: insurer.id,
                    spsolution: true,
                    active: true
                },
                {
                    name: 'Product B',
                    insurer_id: insurer.id,
                    spsolution: false,
                    active: true
                }
            ])
            .returning()
            .execute();

        await db.insert(productSpecsTable)
            .values([
                {
                    shortname: 'PREMIUM',
                    description: 'Monthly Premium',
                    default_value: '250',
                    value_type: 'number',
                    min_value: null,
                    max_value: null,
                    editable: false,
                    group_id: null
                },
                {
                    shortname: 'DEDUCTIBLE',
                    description: 'Annual Deductible',
                    default_value: '1000',
                    value_type: 'number',
                    min_value: 500,
                    max_value: 5000,
                    editable: true,
                    group_id: null
                }
            ])
            .execute();

        const input: CompareProductsInput = {
            product_ids: [products[0].id, products[1].id]
        };

        const result = await compareProducts(input);

        expect(result).toHaveLength(2);
        
        // Check first product
        expect(result[0].product_id).toEqual(products[0].id);
        expect(result[0].product_name).toEqual('Product A');
        expect(result[0].specs).toHaveLength(2);
        
        // Check second product
        expect(result[1].product_id).toEqual(products[1].id);
        expect(result[1].product_name).toEqual('Product B');
        expect(result[1].specs).toHaveLength(2);
        
        // Verify specs contain expected data
        const premiumSpec = result[0].specs.find(s => s.shortname === 'PREMIUM');
        expect(premiumSpec).toBeDefined();
        expect(premiumSpec!.description).toEqual('Monthly Premium');
        expect(premiumSpec!.value_type).toEqual('number');
        expect(premiumSpec!.min_value).toBeNull();
        expect(premiumSpec!.max_value).toBeNull();
        expect(premiumSpec!.editable).toBe(false);
    });

    it('should preserve order of input product_ids', async () => {
        // Create prerequisite data
        const [insurer] = await db.insert(insurersTable)
            .values({ name: 'Test Insurer' })
            .returning()
            .execute();

        const products = await db.insert(productsTable)
            .values([
                {
                    name: 'First Product',
                    insurer_id: insurer.id,
                    spsolution: true,
                    active: true
                },
                {
                    name: 'Second Product',
                    insurer_id: insurer.id,
                    spsolution: false,
                    active: true
                },
                {
                    name: 'Third Product',
                    insurer_id: insurer.id,
                    spsolution: true,
                    active: false
                }
            ])
            .returning()
            .execute();

        // Request products in specific order (reverse of creation order)
        const input: CompareProductsInput = {
            product_ids: [products[2].id, products[0].id, products[1].id]
        };

        const result = await compareProducts(input);

        expect(result).toHaveLength(3);
        expect(result[0].product_name).toEqual('Third Product');
        expect(result[1].product_name).toEqual('First Product');
        expect(result[2].product_name).toEqual('Second Product');
    });

    it('should handle mix of existing and non-existing product IDs', async () => {
        // Create prerequisite data
        const [insurer] = await db.insert(insurersTable)
            .values({ name: 'Test Insurer' })
            .returning()
            .execute();

        const [product] = await db.insert(productsTable)
            .values({
                name: 'Existing Product',
                insurer_id: insurer.id,
                spsolution: true,
                active: true
            })
            .returning()
            .execute();

        const input: CompareProductsInput = {
            product_ids: [
                product.id,
                '550e8400-e29b-41d4-a716-446655440000' // Non-existing ID
            ]
        };

        const result = await compareProducts(input);

        expect(result).toHaveLength(1);
        expect(result[0].product_name).toEqual('Existing Product');
    });

    it('should handle specs with null numeric values correctly', async () => {
        // Create prerequisite data
        const [insurer] = await db.insert(insurersTable)
            .values({ name: 'Test Insurer' })
            .returning()
            .execute();

        const [product] = await db.insert(productsTable)
            .values({
                name: 'Test Product',
                insurer_id: insurer.id,
                spsolution: true,
                active: true
            })
            .returning()
            .execute();

        await db.insert(productSpecsTable)
            .values({
                shortname: 'TEXT_SPEC',
                description: 'Text Specification',
                default_value: 'default text',
                value_type: 'text',
                min_value: null,
                max_value: null,
                editable: true,
                group_id: null
            })
            .execute();

        const input: CompareProductsInput = {
            product_ids: [product.id]
        };

        const result = await compareProducts(input);

        expect(result).toHaveLength(1);
        expect(result[0].specs).toHaveLength(1);
        expect(result[0].specs[0].min_value).toBeNull();
        expect(result[0].specs[0].max_value).toBeNull();
        expect(result[0].specs[0].value_type).toEqual('text');
    });
});
