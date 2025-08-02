
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { ProductSpecDisplay } from '@/components/ProductSpecDisplay';
import { ProductComparison } from '@/components/ProductComparison';
import type { 
  Insurer, 
  Product, 
  ProductSpec,
  ProductSpecGroup,
  ProductSpecGroupChoice
} from '../../server/src/schema';
import type { ProductComparisonResult } from '../../server/src/handlers/compare_products';

function App() {
  // Core data state
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSpecs, setProductSpecs] = useState<ProductSpec[]>([]);
  const [productSpecGroups, setProductSpecGroups] = useState<ProductSpecGroup[]>([]);
  const [productSpecGroupChoices, setProductSpecGroupChoices] = useState<Record<string, ProductSpecGroupChoice[]>>({});
  
  // Filter and selection state
  const [selectedInsurerId, setSelectedInsurerId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedProductsForComparison, setSelectedProductsForComparison] = useState<string[]>([]);
  
  // Comparison data
  const [comparisonData, setComparisonData] = useState<ProductComparisonResult[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingSpecs, setIsLoadingSpecs] = useState(false);

  // Load initial data
  const loadInsurers = useCallback(async () => {
    try {
      const result = await trpc.getInsurers.query();
      setInsurers(result);
    } catch (error) {
      console.error('Failed to load insurers:', error);
    }
  }, []);

  const loadProductSpecGroups = useCallback(async () => {
    try {
      const result = await trpc.getProductSpecGroups.query();
      setProductSpecGroups(result);
    } catch (error) {
      console.error('Failed to load product spec groups:', error);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([loadInsurers(), loadProductSpecGroups()])
      .finally(() => setIsLoading(false));
  }, [loadInsurers, loadProductSpecGroups]);

  // Load products when insurer changes
  const loadProductsByInsurer = useCallback(async (insurerId: string) => {
    if (!insurerId) {
      setProducts([]);
      return;
    }
    
    setIsLoadingProducts(true);
    try {
      const result = await trpc.getProductsByInsurer.query({ insurer_id: insurerId });
      setProducts(result);
      // Reset selected product when changing insurer
      setSelectedProductId('');
      setProductSpecs([]);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    if (selectedInsurerId) {
      loadProductsByInsurer(selectedInsurerId);
    }
  }, [selectedInsurerId, loadProductsByInsurer]);

  // Load product specs when product changes
  const loadProductSpecs = useCallback(async (productId: string) => {
    if (!productId) {
      setProductSpecs([]);
      return;
    }
    
    setIsLoadingSpecs(true);
    try {
      const result = await trpc.getProductSpecs.query({ product_id: productId });
      setProductSpecs(result);
      
      // Load choices for grouped specs
      const groupIds = Array.from(new Set(
        result.filter(spec => spec.group_id).map(spec => spec.group_id!)
      ));
      
      const choicesPromises = groupIds.map(async (groupId) => {
        const choices = await trpc.getProductSpecGroupChoices.query({ group_id: groupId });
        return { groupId, choices };
      });
      
      const choicesResults = await Promise.all(choicesPromises);
      const choicesMap: Record<string, ProductSpecGroupChoice[]> = {};
      choicesResults.forEach(({ groupId, choices }) => {
        choicesMap[groupId] = choices;
      });
      
      setProductSpecGroupChoices(choicesMap);
    } catch (error) {
      console.error('Failed to load product specs:', error);
    } finally {
      setIsLoadingSpecs(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      loadProductSpecs(selectedProductId);
    }
  }, [selectedProductId, loadProductSpecs]);

  // Comparison functionality
  const toggleProductForComparison = useCallback((productId: string) => {
    setSelectedProductsForComparison((prev: string[]) => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else if (prev.length < 5) {
        return [...prev, productId];
      }
      return prev;
    });
  }, []);

  const loadComparisonData = useCallback(async () => {
    if (selectedProductsForComparison.length === 0) {
      setComparisonData([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await trpc.compareProducts.query({ 
        product_ids: selectedProductsForComparison 
      });
      setComparisonData(result);
    } catch (error) {
      console.error('Failed to load comparison data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProductsForComparison]);

  useEffect(() => {
    loadComparisonData();
  }, [loadComparisonData]);

  const selectedInsurer = insurers.find(i => i.id === selectedInsurerId);
  const selectedProduct = products.find(p => p.id === selectedProductId);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading insurance catalog...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">🏢 Insurance Catalog</h1>
          <p className="text-muted-foreground">
            Browse and compare insurance products and specifications
          </p>
        </div>
        {selectedProductsForComparison.length > 0 && (
          <Badge variant="secondary" className="text-lg px-3 py-1">
            📊 {selectedProductsForComparison.length}/5 selected for comparison
          </Badge>
        )}
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse Products</TabsTrigger>
          <TabsTrigger value="compare" disabled={selectedProductsForComparison.length === 0}>
            Compare Products ({selectedProductsForComparison.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>🔍 Filters</CardTitle>
              <CardDescription>
                Select an insurer to view their products
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Insurer</label>
                  <Select value={selectedInsurerId} onValueChange={setSelectedInsurerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an insurer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {insurers.map((insurer: Insurer) => (
                        <SelectItem key={insurer.id} value={insurer.id}>
                          {insurer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedInsurerId && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Product</label>
                    <Select 
                      value={selectedProductId} 
                      onValueChange={setSelectedProductId}
                      disabled={isLoadingProducts}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          isLoadingProducts ? "Loading products..." : "Select a product..."
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product: Product) => (
                          <SelectItem key={product.id} value={product.id}>
                            <div className="flex items-center gap-2">
                              {product.name}
                              {product.spsolution && <Badge variant="outline">SP Solution</Badge>}
                              {!product.active && <Badge variant="destructive">Inactive</Badge>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Products List */}
          {selectedInsurerId && (
            <Card>
              <CardHeader>
                <CardTitle>📋 Products - {selectedInsurer?.name}</CardTitle>
                <CardDescription>
                  {products.length} product{products.length !== 1 ? 's' : ''} available
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingProducts ? (
                  <div className="text-center py-8">Loading products...</div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No products found for this insurer
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {products.map((product: Product) => (
                      <Card 
                        key={product.id} 
                        className={`cursor-pointer transition-colors ${
                          selectedProductId === product.id 
                            ? 'ring-2 ring-primary' 
                            : 'hover:bg-muted/50'
                        } ${
                          selectedProductsForComparison.includes(product.id)
                            ? 'bg-blue-50 border-blue-200'
                            : ''
                        }`}
                        onClick={() => setSelectedProductId(product.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{product.name}</CardTitle>
                            <div className="flex gap-1">
                              {product.spsolution && (
                                <Badge variant="outline" className="text-xs">SP</Badge>
                              )}
                              {!product.active && (
                                <Badge variant="destructive" className="text-xs">Inactive</Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex justify-between items-center">
                            <Badge variant="secondary">{selectedInsurer?.name}</Badge>
                            <Button
                              size="sm"
                              variant={
                                selectedProductsForComparison.includes(product.id)
                                  ? "default"
                                  : "outline"
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleProductForComparison(product.id);
                              }}
                              disabled={
                                !selectedProductsForComparison.includes(product.id) && 
                                selectedProductsForComparison.length >= 5
                              }
                            >
                              {selectedProductsForComparison.includes(product.id) 
                                ? "✓ Selected" 
                                : "Compare"
                              }
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Product Specifications */}
          {selectedProductId && (
            <Card>
              <CardHeader>
                <CardTitle>⚙️ Product Specifications - {selectedProduct?.name}</CardTitle>
                <CardDescription>
                  Product specifications and their current values
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSpecs ? (
                  <div className="text-center py-8">Loading specifications...</div>
                ) : productSpecs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No specifications found for this product
                  </div>
                ) : (
                  <ProductSpecDisplay
                    productSpecs={productSpecs}
                    productSpecGroups={productSpecGroups}
                    productSpecGroupChoices={productSpecGroupChoices}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="compare" className="space-y-6">
          <ProductComparison
            comparisonData={comparisonData}
            productSpecGroups={productSpecGroups}
            productSpecGroupChoices={productSpecGroupChoices}
            onRemoveProduct={(productId: string) => toggleProductForComparison(productId)}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
