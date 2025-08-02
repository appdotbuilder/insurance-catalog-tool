
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useState, useCallback } from 'react';
import type { 
  ProductSpec, 
  ProductSpecGroup, 
  ProductSpecGroupChoice 
} from '../../../server/src/schema';

interface ProductSpecDisplayProps {
  productSpecs: ProductSpec[];
  productSpecGroups: ProductSpecGroup[];
  productSpecGroupChoices: Record<string, ProductSpecGroupChoice[]>;
}

export function ProductSpecDisplay({ 
  productSpecs, 
  productSpecGroups, 
  productSpecGroupChoices 
}: ProductSpecDisplayProps) {
  const [specValues, setSpecValues] = useState<Record<string, string>>({});
  const [groupChoiceValues, setGroupChoiceValues] = useState<Record<string, string>>({});

  const handleSpecValueChange = useCallback((specId: string, value: string) => {
    setSpecValues((prev: Record<string, string>) => ({
      ...prev,
      [specId]: value
    }));
  }, []);

  const handleGroupChoiceChange = useCallback((groupId: string, choiceId: string) => {
    setGroupChoiceValues((prev: Record<string, string>) => ({
      ...prev,
      [groupId]: choiceId
    }));
  }, []);

  const getValueTypeIcon = (valueType: string) => {
    switch (valueType) {
      case 'text': return '📝';
      case 'number': return '🔢';
      case 'percentage': return '📊';
      default: return '❓';
    }
  };

  const getGroupedSpecs = () => {
    const grouped: Record<string, ProductSpec[]> = { ungrouped: [] };
    
    productSpecs.forEach((spec: ProductSpec) => {
      if (spec.group_id) {
        if (!grouped[spec.group_id]) {
          grouped[spec.group_id] = [];
        }
        grouped[spec.group_id].push(spec);
      } else {
        grouped.ungrouped.push(spec);
      }
    });
    
    return grouped;
  };

  const renderSpecInput = (spec: ProductSpec) => {
    if (spec.group_id) {
      // This spec is controlled by group choice
      return (
        <div className="text-sm text-muted-foreground italic">
          Value determined by group choice above
        </div>
      );
    }
    
    if (!spec.editable) {
      // Static value
      return (
        <div className="text-sm font-medium">
          {spec.default_value}
          <Badge variant="secondary" className="ml-2">Static</Badge>
        </div>
      );
    }
    
    // Editable value
    const inputProps = {
      value: specValues[spec.id] || spec.default_value,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => 
        handleSpecValueChange(spec.id, e.target.value),
      className: "max-w-xs"
    };
    
    if (spec.value_type === 'number' || spec.value_type === 'percentage') {
      return (
        <Input
          {...inputProps}
          type="number"
          min={spec.min_value || undefined}
          max={spec.max_value || undefined}
          step={spec.value_type === 'percentage' ? "0.01" : "any"}
        />
      );
    }
    
    return <Input {...inputProps} type="text" />;
  };

  const renderGroupChoice = (groupId: string) => {
    const choices = productSpecGroupChoices[groupId] || [];
    const group = productSpecGroups.find(g => g.id === groupId);
    
    if (choices.length === 0) return null;
    
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Choose {group?.name} variant:
        </Label>
        <Select 
          value={groupChoiceValues[groupId] || ''} 
          onValueChange={(value) => handleGroupChoiceChange(groupId, value)}
        >
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="Select variant..." />
          </SelectTrigger>
          <SelectContent>
            {choices.map((choice: ProductSpecGroupChoice) => (
              <SelectItem key={choice.id} value={choice.id}>
                {choice.choice_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const groupedSpecs = getGroupedSpecs();

  return (
    <div className="space-y-6">
      {/* Ungrouped specs */}
      {groupedSpecs.ungrouped.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">General Specifications</h3>
          <div className="grid gap-4">
            {groupedSpecs.ungrouped.map((spec: ProductSpec) => (
              <Card key={spec.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getValueTypeIcon(spec.value_type)}</span>
                        <Label className="font-medium">{spec.shortname}</Label>
                        <Badge variant="outline" className="text-xs">
                          {spec.value_type}
                        </Badge>
                        {spec.editable && (
                          <Badge variant="default" className="text-xs">Editable</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{spec.description}</p>
                      {(spec.min_value !== null || spec.max_value !== null) && (
                        <p className="text-xs text-muted-foreground">
                          Range: {spec.min_value ?? 'No min'} - {spec.max_value ?? 'No max'}
                        </p>
                      )}
                    </div>
                    <div className="ml-4">
                      {renderSpecInput(spec)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Grouped specs */}
      {Object.entries(groupedSpecs).map(([groupId, specs]) => {
        if (groupId === 'ungrouped' || specs.length === 0) return null;
        
        const group = productSpecGroups.find(g => g.id === groupId);
        
        return (
          <div key={groupId} className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                🎯 {group?.name || 'Unknown Group'}
              </h3>
              <p className="text-sm text-muted-foreground">
                Specifications controlled by group choice
              </p>
            </div>
            
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                {renderGroupChoice(groupId)}
              </CardContent>
            </Card>
            
            <div className="grid gap-4">
              {specs.map((spec: ProductSpec) => (
                <Card key={spec.id} className="bg-muted/30">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getValueTypeIcon(spec.value_type)}</span>
                          <Label className="font-medium">{spec.shortname}</Label>
                          <Badge variant="outline" className="text-xs">
                            {spec.value_type}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">Group Controlled</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{spec.description}</p>
                        {(spec.min_value !== null || spec.max_value !== null) && (
                          <p className="text-xs text-muted-foreground">
                            Range: {spec.min_value ?? 'No min'} - {spec.max_value ?? 'No max'}
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        {renderSpecInput(spec)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
