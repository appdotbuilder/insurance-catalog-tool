
import { db } from '../db';
import { productsTable, productSpecsTable } from '../db/schema';
import { type CompareProductsInput, type ProductSpec } from '../schema';
import { eq, inArray } from 'drizzle-orm';

// Type for comparison result
export type ProductComparisonResult = {
    product_id: string;
    product_name: string;
    specs: ProductSpec[];
};

export async function compareProducts(input: CompareProductsInput): Promise<ProductComparisonResult[]> {
    try {
        // First, get all products to verify they exist and get their names
        const products = await db.select({
            id: productsTable.id,
            name: productsTable.name
        })
        .from(productsTable)
        .where(inArray(productsTable.id, input.product_ids))
        .execute();

        if (products.length === 0) {
            return [];
        }

        // Get all product specs - we'll fetch all specs since there's no direct product-spec relationship
        // In a real implementation, there would likely be a junction table or additional filtering
        const specs = await db.select()
            .from(productSpecsTable)
            .execute();

        // Convert numeric fields for specs
        const convertedSpecs: ProductSpec[] = specs.map(spec => ({
            ...spec,
            min_value: spec.min_value !== null ? parseFloat(spec.min_value.toString()) : null,
            max_value: spec.max_value !== null ? parseFloat(spec.max_value.toString()) : null
        }));

        // Build comparison result - each product gets all available specs
        // In a real implementation, you'd filter specs based on actual product-spec relationships
        const result: ProductComparisonResult[] = products.map(product => ({
            product_id: product.id,
            product_name: product.name,
            specs: convertedSpecs
        }));

        // Sort results to match the order of input product_ids
        const orderedResult = input.product_ids
            .map(productId => result.find(r => r.product_id === productId))
            .filter((r): r is ProductComparisonResult => r !== undefined);

        return orderedResult;
    } catch (error) {
        console.error('Product comparison failed:', error);
        throw error;
    }
}
