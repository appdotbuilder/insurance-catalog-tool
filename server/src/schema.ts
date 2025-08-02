
import { z } from 'zod';

// Enums
export const valueTypeEnum = z.enum(['text', 'number', 'percentage']);
export type ValueType = z.infer<typeof valueTypeEnum>;

// Insurer schemas
export const insurerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export type Insurer = z.infer<typeof insurerSchema>;

export const createInsurerInputSchema = z.object({
  name: z.string().min(1),
});

export type CreateInsurerInput = z.infer<typeof createInsurerInputSchema>;

// Product schemas
export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  insurer_id: z.string().uuid(),
  spsolution: z.boolean(),
  active: z.boolean(),
});

export type Product = z.infer<typeof productSchema>;

export const createProductInputSchema = z.object({
  name: z.string().min(1),
  insurer_id: z.string().uuid(),
  spsolution: z.boolean(),
  active: z.boolean(),
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

// ProductSpecGroup schemas
export const productSpecGroupSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export type ProductSpecGroup = z.infer<typeof productSpecGroupSchema>;

export const createProductSpecGroupInputSchema = z.object({
  name: z.string().min(1),
});

export type CreateProductSpecGroupInput = z.infer<typeof createProductSpecGroupInputSchema>;

// ProductSpec schemas
export const productSpecSchema = z.object({
  id: z.string().uuid(),
  shortname: z.string(),
  description: z.string(),
  default_value: z.string(),
  value_type: valueTypeEnum,
  min_value: z.number().nullable(),
  max_value: z.number().nullable(),
  editable: z.boolean(),
  group_id: z.string().uuid().nullable(),
});

export type ProductSpec = z.infer<typeof productSpecSchema>;

export const createProductSpecInputSchema = z.object({
  shortname: z.string().min(1),
  description: z.string(),
  default_value: z.string(),
  value_type: valueTypeEnum,
  min_value: z.number().nullable(),
  max_value: z.number().nullable(),
  editable: z.boolean(),
  group_id: z.string().uuid().nullable(),
});

export type CreateProductSpecInput = z.infer<typeof createProductSpecInputSchema>;

// ProductSpecGroupChoice schemas
export const productSpecGroupChoiceSchema = z.object({
  id: z.string().uuid(),
  product_spec_group_id: z.string().uuid(),
  choice_name: z.string(),
});

export type ProductSpecGroupChoice = z.infer<typeof productSpecGroupChoiceSchema>;

export const createProductSpecGroupChoiceInputSchema = z.object({
  product_spec_group_id: z.string().uuid(),
  choice_name: z.string().min(1),
});

export type CreateProductSpecGroupChoiceInput = z.infer<typeof createProductSpecGroupChoiceInputSchema>;

// ProductSpecGroupChoiceValue schemas
export const productSpecGroupChoiceValueSchema = z.object({
  product_spec_group_choice_id: z.string().uuid(),
  product_spec_id: z.string().uuid(),
  value: z.string(),
});

export type ProductSpecGroupChoiceValue = z.infer<typeof productSpecGroupChoiceValueSchema>;

export const createProductSpecGroupChoiceValueInputSchema = z.object({
  product_spec_group_choice_id: z.string().uuid(),
  product_spec_id: z.string().uuid(),
  value: z.string(),
});

export type CreateProductSpecGroupChoiceValueInput = z.infer<typeof createProductSpecGroupChoiceValueInputSchema>;

// Query input schemas
export const getProductsByInsurerInputSchema = z.object({
  insurer_id: z.string().uuid(),
});

export type GetProductsByInsurerInput = z.infer<typeof getProductsByInsurerInputSchema>;

export const getProductSpecsInputSchema = z.object({
  product_id: z.string().uuid(),
});

export type GetProductSpecsInput = z.infer<typeof getProductSpecsInputSchema>;

export const getProductSpecGroupChoicesInputSchema = z.object({
  group_id: z.string().uuid(),
});

export type GetProductSpecGroupChoicesInput = z.infer<typeof getProductSpecGroupChoicesInputSchema>;

export const getProductSpecGroupChoiceValuesInputSchema = z.object({
  choice_id: z.string().uuid(),
});

export type GetProductSpecGroupChoiceValuesInput = z.infer<typeof getProductSpecGroupChoiceValuesInputSchema>;

export const compareProductsInputSchema = z.object({
  product_ids: z.array(z.string().uuid()).min(1).max(5),
});

export type CompareProductsInput = z.infer<typeof compareProductsInputSchema>;
