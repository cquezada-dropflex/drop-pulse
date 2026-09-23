// Documentos GraphQL del Admin API de Shopify. Solo lectura: el onboarding no escribe en la tienda.
// Pedidos sin ningún campo de cliente (PERMS_SHOPIFY: “Nunca: datos de pago ni clientes fuera de tus pedidos”).

export const SHOP_QUERY = /* GraphQL */ `
  query DropFlexShop {
    shop { id name currencyCode myshopifyDomain }
    productsCount(query: "status:active") { count }
  }
`;

export interface ShopQuery {
  shop: { id: string; name: string; currencyCode: string; myshopifyDomain: string };
  productsCount: { count: number } | null;
}

export const PRODUCTS_QUERY = (withCost: boolean) => /* GraphQL */ `
  query DropFlexProducts($first: Int!, $after: String) {
    products(first: $first, after: $after, query: "status:active", sortKey: ID) {
      nodes {
        id
        title
        handle
        status
        description(truncateAt: 20)
        mediaCount { count }
        featuredMedia { preview { image { url(transform: { maxWidth: 160, maxHeight: 160 }) } } }
        variants(first: 1) {
          nodes {
            price
            compareAtPrice
            ${withCost ? "inventoryItem { unitCost { amount } }" : ""}
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export interface ProductNode {
  id: string;
  title: string;
  handle: string;
  status: string;
  description: string;
  mediaCount: { count: number } | null;
  featuredMedia: { preview: { image: { url: string } | null } | null } | null;
  variants: {
    nodes: { price: string; compareAtPrice: string | null; inventoryItem?: { unitCost: { amount: string } | null } | null }[];
  };
}

export interface ProductsQuery {
  products: { nodes: ProductNode[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } };
}

export const ORDERS_QUERY = /* GraphQL */ `
  query DropFlexOrders($first: Int!, $after: String, $query: String!) {
    orders(first: $first, after: $after, query: $query, sortKey: CREATED_AT) {
      nodes { lineItems(first: 50) { nodes { quantity product { id } } } }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export interface OrdersQuery {
  orders: {
    nodes: { lineItems: { nodes: { quantity: number; product: { id: string } | null }[] } }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
}
