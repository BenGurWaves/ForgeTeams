import { decrypt } from "./encryption";

const SHOPIFY_API_VERSION = "2026-01";

interface ShopifyGraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
  }>;
}

export async function shopifyGraphQL<T = unknown>(
  shopDomain: string,
  encryptedToken: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const accessToken = decrypt(encryptedToken);
  const url = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(
      `Shopify API error: ${response.status} ${response.statusText}`
    );
  }

  const json: ShopifyGraphQLResponse<T> = await response.json();

  if (json.errors?.length) {
    throw new Error(
      `Shopify GraphQL errors: ${json.errors.map((e) => e.message).join(", ")}`
    );
  }

  if (!json.data) {
    throw new Error("No data returned from Shopify GraphQL");
  }

  return json.data;
}

// ============================================================
// Typed Query / Mutation Helpers
// ============================================================

interface ProductVariant {
  id: string;
  title: string;
  price: string;
  compareAtPrice: string | null;
  inventoryQuantity: number;
}

interface Product {
  id: string;
  title: string;
  variants: { edges: Array<{ node: ProductVariant }> };
}

interface ProductsResponse {
  products: { edges: Array<{ node: Product }> };
}

export async function getProducts(
  shopDomain: string,
  encryptedToken: string,
  first = 10
): Promise<object[]> {
  const query = `
    query getProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  price
                  compareAtPrice
                  inventoryQuantity
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyGraphQL<ProductsResponse>(
    shopDomain,
    encryptedToken,
    query,
    { first }
  );

  return data.products.edges.map((e) => ({
    id: e.node.id,
    title: e.node.title,
    variants: e.node.variants.edges.map((v) => v.node),
  }));
}

export async function getProductByTitle(
  shopDomain: string,
  encryptedToken: string,
  title: string
): Promise<object | null> {
  const query = `
    query getProductByTitle($queryStr: String!) {
      products(first: 1, query: $queryStr) {
        edges {
          node {
            id
            title
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  price
                  compareAtPrice
                  inventoryQuantity
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyGraphQL<ProductsResponse>(
    shopDomain,
    encryptedToken,
    query,
    { queryStr: `title:${title}` }
  );

  const first = data.products.edges[0];
  if (!first) return null;

  return {
    id: first.node.id,
    title: first.node.title,
    variants: first.node.variants.edges.map((v) => v.node),
  };
}

interface VariantUpdateResponse {
  productVariantUpdate: {
    productVariant: { id: string; title: string; price: string } | null;
    userErrors: Array<{ field: string[]; message: string }>;
  };
}

export async function updateVariantPrice(
  shopDomain: string,
  encryptedToken: string,
  variantId: string,
  newPrice: string
): Promise<{ id: string; title: string; price: string }> {
  const mutation = `
    mutation productVariantUpdate($input: ProductVariantInput!) {
      productVariantUpdate(input: $input) {
        productVariant {
          id
          title
          price
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await shopifyGraphQL<VariantUpdateResponse>(
    shopDomain,
    encryptedToken,
    mutation,
    { input: { id: variantId, price: newPrice } }
  );

  const result = data.productVariantUpdate;

  if (result.userErrors.length > 0) {
    throw new Error(
      `Shopify user errors: ${result.userErrors.map((e) => e.message).join(", ")}`
    );
  }

  if (!result.productVariant) {
    throw new Error("No variant returned after update");
  }

  return result.productVariant;
}

interface Order {
  id: string;
  name: string;
  totalPriceSet: {
    shopMoney: { amount: string; currencyCode: string };
  };
  createdAt: string;
  displayFinancialStatus: string;
}

interface OrdersResponse {
  orders: { edges: Array<{ node: Order }> };
}

export async function getOrders(
  shopDomain: string,
  encryptedToken: string,
  first = 10
): Promise<object[]> {
  const query = `
    query getOrders($first: Int!) {
      orders(first: $first) {
        edges {
          node {
            id
            name
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            createdAt
            displayFinancialStatus
          }
        }
      }
    }
  `;

  const data = await shopifyGraphQL<OrdersResponse>(
    shopDomain,
    encryptedToken,
    query,
    { first }
  );

  return data.orders.edges.map((e) => e.node);
}
