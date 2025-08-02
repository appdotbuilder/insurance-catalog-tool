
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X } from 'lucide-react';
import type { 
  ProductSpecGroup, 
  ProductSpecGroupChoice 
} from '../../../server/src/schema';
import type { ProductComparisonResult } from '../../../server/src/handlers/compare_products';

interface ProductComparisonProps {
  comparisonData: ProductComparisonResult[];
  productSpecGroups: ProductSpecGroup[];
  productSpecGroupChoices: Record<string, ProductSpecGroupChoice[]>;
  onRemoveProduct: (productId: string) => void;
  isLoading: boolean;
}

export function ProductComparison({ 
  comparisonData, 
  productSpecGroups, 
  onRemoveProduct, 
  isLoading 
}: ProductComparisonProps) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-lg">Loading comparison data...</div>
      </div>
    );
  }

  if (comparisonData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 Product Comparison</CardTitle>
          <CardDescription>
            Select products from the Browse tab to compare their specifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <div className="text-4xl mb-4">🔍</div>
            <p>No products selected for comparison</p>
            <p className="text-sm mt-2">Go to the Browse tab and click "Compare" on products you want to compare</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get all unique specs across all products for comparison
  const allSpecs = Array.from(
    new Map(
      comparisonData.flatMap(product => 
        product.specs.map(spec => [spec.id, spec])
      )
    ).values()
  );

  const getValueTypeIcon = (valueType: string) => {
    switch (valueType) {
      case 'text': return '📝';
      case 'number': return '🔢';
      case 'percentage': return '📊';
      default: return '❓';
    }
  };

  const getGroupName = (groupId: string | null) => {
    if (!groupId) return null;
    return productSpecGroups.find(g => g.id === groupId)?.name || 'Unknown Group';
  };

  // Group specs by their group_id for better organization
  const groupedSpecs = allSpecs.reduce((acc, spec) => {
    const groupKey = spec.group_id || 'ungrouped';
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(spec);
    return acc;
  }, {} as Record<string, typeof allSpecs>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>📊 Product Comparison</span>
            <Badge variant="secondary">
              {comparisonData.length} product{comparisonData.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          <CardDescription>
            Compare specifications across selected products
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Product Headers */}
          <div className="mb-6 flex gap-4 overflow-x-auto">
            {comparisonData.map((product) => (
              <Card key={product.product_id} className="min-w-[200px] flex-shrink-0">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{product.product_name}</CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveProduct(product.product_id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Badge variant="outline">
                    {product.specs.length} spec{product.specs.length !== 1 ? 's' : ''}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="space-y-8">
            {Object.entries(groupedSpecs).map(([groupKey, specs]) => (
              <div key={groupKey}>
                {groupKey !== 'ungrouped' && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      🎯 {getGroupName(groupKey)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Group-controlled specifications
                    </p>
                  </div>
                )}
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Specification</TableHead>
                        {comparisonData.map((product) => (
                          <TableHead key={product.product_id} className="text-center">
                            {product.product_name}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {specs.map((spec) => {
                        const specInProducts = comparisonData.map(product => 
                          product.specs.find(s => s.id === spec.id)
                        );
                        
                        return (
                          <TableRow key={spec.id}>
                            <TableCell className="font-medium">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{getValueTypeIcon(spec.value_type)}</span>
                                  <span>{spec.shortname}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {spec.value_type}
                                  
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {spec.description}
                                </p>
                                {(spec.min_value !== null || spec.max_value !== null) && (
                                  <p className="text-xs text-muted-foreground">
                                    Range: {spec.min_value ?? 'No min'} - {spec.max_value ?? 'No max'}
                                  </p>
                                )}
                                <div className="flex gap-1">
                                  {spec.editable && (
                                    <Badge variant="default" className="text-xs">Editable</Badge>
                                  )}
                                  {spec.group_id && (
                                    <Badge variant="secondary" className="text-xs">Group Controlled</Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            {specInProducts.map((productSpec, index) => (
                              <TableCell key={`${spec.id}-${index}`} className="text-center">
                                {productSpec ? (
                                  <div className="space-y-1">
                                    <div className="font-medium">
                                      {productSpec.default_value}
                                    </div>
                                    {productSpec.group_id && (
                                      <Badge variant="outline" className="text-xs">
                                        Group: {getGroupName(productSpec.group_id)}
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground italic">
                                    Not available
                                  </span>
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>

          {comparisonData.length < 5 && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                💡 You can compare up to 5 products. Go back to Browse tab to add more products.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
