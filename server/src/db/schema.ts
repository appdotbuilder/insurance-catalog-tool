
import { pgTable, uuid, text, boolean, real, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const valueTypeEnum = pgEnum('value_type', ['text', 'number', 'percentage']);

// Tables
export const insurersTable = pgTable('insurers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
});

export const productsTable = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  insurer_id: uuid('insurer_id').notNull().references(() => insurersTable.id),
  spsolution: boolean('spsolution').notNull(),
  active: boolean('active').notNull(),
});

export const productSpecGroupsTable = pgTable('product_spec_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
});

export const productSpecsTable = pgTable('product_specs', {
  id: uuid('id').primaryKey().defaultRandom(),
  shortname: text('shortname').notNull(),
  description: text('description').notNull(),
  default_value: text('default_value').notNull(),
  value_type: valueTypeEnum('value_type').notNull(),
  min_value: real('min_value'),
  max_value: real('max_value'),
  editable: boolean('editable').notNull(),
  group_id: uuid('group_id').references(() => productSpecGroupsTable.id),
});

export const productSpecGroupChoicesTable = pgTable('product_spec_group_choices', {
  id: uuid('id').primaryKey().defaultRandom(),
  product_spec_group_id: uuid('product_spec_group_id').notNull().references(() => productSpecGroupsTable.id),
  choice_name: text('choice_name').notNull(),
});

export const productSpecGroupChoiceValuesTable = pgTable('product_spec_group_choice_values', {
  product_spec_group_choice_id: uuid('product_spec_group_choice_id').notNull().references(() => productSpecGroupChoicesTable.id),
  product_spec_id: uuid('product_spec_id').notNull().references(() => productSpecsTable.id),
  value: text('value').notNull(),
});

// Relations
export const insurersRelations = relations(insurersTable, ({ many }) => ({
  products: many(productsTable),
}));

export const productsRelations = relations(productsTable, ({ one }) => ({
  insurer: one(insurersTable, {
    fields: [productsTable.insurer_id],
    references: [insurersTable.id],
  }),
}));

export const productSpecGroupsRelations = relations(productSpecGroupsTable, ({ many }) => ({
  productSpecs: many(productSpecsTable),
  choices: many(productSpecGroupChoicesTable),
}));

export const productSpecsRelations = relations(productSpecsTable, ({ one, many }) => ({
  group: one(productSpecGroupsTable, {
    fields: [productSpecsTable.group_id],
    references: [productSpecGroupsTable.id],
  }),
  choiceValues: many(productSpecGroupChoiceValuesTable),
}));

export const productSpecGroupChoicesRelations = relations(productSpecGroupChoicesTable, ({ one, many }) => ({
  group: one(productSpecGroupsTable, {
    fields: [productSpecGroupChoicesTable.product_spec_group_id],
    references: [productSpecGroupsTable.id],
  }),
  values: many(productSpecGroupChoiceValuesTable),
}));

export const productSpecGroupChoiceValuesRelations = relations(productSpecGroupChoiceValuesTable, ({ one }) => ({
  choice: one(productSpecGroupChoicesTable, {
    fields: [productSpecGroupChoiceValuesTable.product_spec_group_choice_id],
    references: [productSpecGroupChoicesTable.id],
  }),
  productSpec: one(productSpecsTable, {
    fields: [productSpecGroupChoiceValuesTable.product_spec_id],
    references: [productSpecsTable.id],
  }),
}));

// TypeScript types
export type Insurer = typeof insurersTable.$inferSelect;
export type NewInsurer = typeof insurersTable.$inferInsert;

export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;

export type ProductSpecGroup = typeof productSpecGroupsTable.$inferSelect;
export type NewProductSpecGroup = typeof productSpecGroupsTable.$inferInsert;

export type ProductSpec = typeof productSpecsTable.$inferSelect;
export type NewProductSpec = typeof productSpecsTable.$inferInsert;

export type ProductSpecGroupChoice = typeof productSpecGroupChoicesTable.$inferSelect;
export type NewProductSpecGroupChoice = typeof productSpecGroupChoicesTable.$inferInsert;

export type ProductSpecGroupChoiceValue = typeof productSpecGroupChoiceValuesTable.$inferSelect;
export type NewProductSpecGroupChoiceValue = typeof productSpecGroupChoiceValuesTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  insurers: insurersTable,
  products: productsTable,
  productSpecGroups: productSpecGroupsTable,
  productSpecs: productSpecsTable,
  productSpecGroupChoices: productSpecGroupChoicesTable,
  productSpecGroupChoiceValues: productSpecGroupChoiceValuesTable,
};
