/**
 * Creates the local DynamoDB tables (matches the SAM multi-table schema).
 * Run after: docker compose up -d
 */
import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  type GlobalSecondaryIndex,
  type AttributeDefinition,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: "us-east-1",
  endpoint: process.env.DYNAMODB_ENDPOINT ?? "http://localhost:8000",
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
});

const ENV = process.env.ENVIRONMENT ?? "dev";

function gsi(name: string): GlobalSecondaryIndex {
  return {
    IndexName: name,
    KeySchema: [
      { AttributeName: `${name}PK`, KeyType: "HASH" },
      { AttributeName: `${name}SK`, KeyType: "RANGE" },
    ],
    Projection: { ProjectionType: "ALL" },
  };
}

function gsiAttrs(name: string): AttributeDefinition[] {
  return [
    { AttributeName: `${name}PK`, AttributeType: "S" },
    { AttributeName: `${name}SK`, AttributeType: "S" },
  ];
}

const BASE_ATTRS: AttributeDefinition[] = [
  { AttributeName: "PK", AttributeType: "S" },
  { AttributeName: "SK", AttributeType: "S" },
];

const TABLES: {
  name: string;
  indexes: string[];
}[] = [
  { name: process.env.PRODUCTS_TABLE ?? `blossompot-products-${ENV}`, indexes: ["GSI1"] },
  { name: process.env.ORDERS_TABLE ?? `blossompot-orders-${ENV}`, indexes: ["GSI1", "GSI2", "GSI3"] },
  { name: process.env.CARTS_TABLE ?? `blossompot-carts-${ENV}`, indexes: ["GSI1"] },
  { name: process.env.CUSTOMERS_TABLE ?? `blossompot-customers-${ENV}`, indexes: ["GSI1"] },
  { name: process.env.EVENTS_TABLE ?? `blossompot-events-${ENV}`, indexes: ["GSI1"] },
  { name: process.env.CONFIG_TABLE ?? `blossompot-config-${ENV}`, indexes: [] },
];

async function ensureTable(name: string, indexes: string[]) {
  try {
    await client.send(new DescribeTableCommand({ TableName: name }));
    console.log(`Table "${name}" already exists.`);
    return;
  } catch {
    /* create */
  }

  const attrs = [...BASE_ATTRS, ...indexes.flatMap(gsiAttrs)];
  await client.send(
    new CreateTableCommand({
      TableName: name,
      BillingMode: "PAY_PER_REQUEST",
      AttributeDefinitions: attrs,
      KeySchema: [
        { AttributeName: "PK", KeyType: "HASH" },
        { AttributeName: "SK", KeyType: "RANGE" },
      ],
      ...(indexes.length ? { GlobalSecondaryIndexes: indexes.map(gsi) } : {}),
    })
  );
  console.log(`Created table "${name}".`);
}

async function main() {
  for (const t of TABLES) {
    await ensureTable(t.name, t.indexes);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
