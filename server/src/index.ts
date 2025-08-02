
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Schema imports
import {
  createInsurerInputSchema,
  getProductsByInsurerInputSchema,
  createProductInputSchema,
  getProductSpecsInputSchema,
  createProductSpecInputSchema,
  createProductSpecGroupInputSchema,
  getProductSpecGroupChoicesInputSchema,
  createProductSpecGroupChoiceInputSchema,
  getProductSpecGroupChoiceValuesInputSchema,
  createProductSpecGroupChoiceValueInputSchema,
  compareProductsInputSchema,
} from './schema';

// Handler imports
import { getInsurers } from './handlers/get_insurers';
import { createInsurer } from './handlers/create_insurer';
import { getProductsByInsurer } from './handlers/get_products_by_insurer';
import { createProduct } from './handlers/create_product';
import { getProductSpecs } from './handlers/get_product_specs';
import { createProductSpec } from './handlers/create_product_spec';
import { getProductSpecGroups } from './handlers/get_product_spec_groups';
import { createProductSpecGroup } from './handlers/create_product_spec_group';
import { getProductSpecGroupChoices } from './handlers/get_product_spec_group_choices';
import { createProductSpecGroupChoice } from './handlers/create_product_spec_group_choice';
import { getProductSpecGroupChoiceValues } from './handlers/get_product_spec_group_choice_values';
import { createProductSpecGroupChoiceValue } from './handlers/create_product_spec_group_choice_value';
import { compareProducts } from './handlers/compare_products';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Insurer routes
  getInsurers: publicProcedure
    .query(() => getInsurers()),
  createInsurer: publicProcedure
    .input(createInsurerInputSchema)
    .mutation(({ input }) => createInsurer(input)),

  // Product routes
  getProductsByInsurer: publicProcedure
    .input(getProductsByInsurerInputSchema)
    .query(({ input }) => getProductsByInsurer(input)),
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),

  // ProductSpec routes
  getProductSpecs: publicProcedure
    .input(getProductSpecsInputSchema)
    .query(({ input }) => getProductSpecs(input)),
  createProductSpec: publicProcedure
    .input(createProductSpecInputSchema)
    .mutation(({ input }) => createProductSpec(input)),

  // ProductSpecGroup routes
  getProductSpecGroups: publicProcedure
    .query(() => getProductSpecGroups()),
  createProductSpecGroup: publicProcedure
    .input(createProductSpecGroupInputSchema)
    .mutation(({ input }) => createProductSpecGroup(input)),

  // ProductSpecGroupChoice routes
  getProductSpecGroupChoices: publicProcedure
    .input(getProductSpecGroupChoicesInputSchema)
    .query(({ input }) => getProductSpecGroupChoices(input)),
  createProductSpecGroupChoice: publicProcedure
    .input(createProductSpecGroupChoiceInputSchema)
    .mutation(({ input }) => createProductSpecGroupChoice(input)),

  // ProductSpecGroupChoiceValue routes
  getProductSpecGroupChoiceValues: publicProcedure
    .input(getProductSpecGroupChoiceValuesInputSchema)
    .query(({ input }) => getProductSpecGroupChoiceValues(input)),
  createProductSpecGroupChoiceValue: publicProcedure
    .input(createProductSpecGroupChoiceValueInputSchema)
    .mutation(({ input }) => createProductSpecGroupChoiceValue(input)),

  // Comparison functionality
  compareProducts: publicProcedure
    .input(compareProductsInputSchema)
    .query(({ input }) => compareProducts(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
