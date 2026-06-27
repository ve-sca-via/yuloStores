import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import buildApp from "../buildApp.js";

const TEST_DB_URI =
  process.env.TEST_MONGODB_URI ||
  "mongodb://127.0.0.1:27017/yulostores_test";

let app;
let counter = 0;
// Unique identifiers per call so tests don't collide on unique fields.
const uniqueEmail = () => `user_${Date.now()}_${counter++}@test.com`;
const uniqueEmployeeId = () => `emp_${Date.now()}_${counter++}`;

const post = (url, payload, token) =>
  app.inject({
    method: "POST",
    url,
    payload,
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });

const get = (url, token) =>
  app.inject({
    method: "GET",
    url,
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });

// Signs up an owner and (optionally) registers a restaurant; returns helpers.
async function createOwner({ withRestaurant = false } = {}) {
  const email = uniqueEmail();
  const res = await post("/restaurant_owner/signup", {
    name: "Owner",
    email,
    password: "secret123",
  });
  const body = res.json();
  const token = body.data.token;
  const ownerId = body.data.owner.id;

  let restaurantId = null;
  if (withRestaurant) {
    const reg = await post(
      "/restaurant_owner/register_restaurant",
      { name: "Test Diner" },
      token,
    );
    restaurantId = reg.json().data.restaurant.id;
  }

  return { email, token, ownerId, restaurantId };
}

before(async () => {
  await mongoose.connect(TEST_DB_URI);
  app = await buildApp({ logger: false, rateLimit: false });
  await app.ready();
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await app.close();
});

describe("owner signup & login", () => {
  it("signs up and returns a token", async () => {
    const res = await post("/restaurant_owner/signup", {
      name: "Alice",
      email: uniqueEmail(),
      password: "secret123",
    });
    assert.equal(res.statusCode, 201);
    assert.equal(res.json().status, "success");
    assert.ok(res.json().data.token, "expected a JWT token");
  });

  it("stores the password as a bcrypt hash, never plaintext", async () => {
    const email = uniqueEmail();
    await post("/restaurant_owner/signup", {
      name: "Bob",
      email,
      password: "secret123",
    });
    const stored = await mongoose.connection
      .collection("restaurantowners")
      .findOne({ email });
    assert.ok(stored.password.startsWith("$2"), "should be a bcrypt hash");
    assert.notEqual(stored.password, "secret123");
  });

  it("rejects signup with missing fields (400 validation)", async () => {
    const res = await post("/restaurant_owner/signup", { email: uniqueEmail() });
    assert.equal(res.statusCode, 400);
    assert.equal(res.json().status, "error");
  });

  it("rejects signup with a too-short password (400 validation)", async () => {
    const res = await post("/restaurant_owner/signup", {
      name: "Shorty",
      email: uniqueEmail(),
      password: "123",
    });
    assert.equal(res.statusCode, 400);
  });

  it("rejects a duplicate email (409)", async () => {
    const email = uniqueEmail();
    const payload = { name: "Dup", email, password: "secret123" };
    await post("/restaurant_owner/signup", payload);
    const res = await post("/restaurant_owner/signup", payload);
    assert.equal(res.statusCode, 409);
  });

  it("logs in with correct password and rejects the wrong one", async () => {
    const email = uniqueEmail();
    await post("/restaurant_owner/signup", {
      name: "Carol",
      email,
      password: "secret123",
    });

    const bad = await post("/restaurant_owner/login", {
      email,
      password: "WRONG",
    });
    assert.equal(bad.statusCode, 401);

    const good = await post("/restaurant_owner/login", {
      email,
      password: "secret123",
    });
    assert.equal(good.statusCode, 200);
    assert.ok(good.json().data.token);
  });

  it("rejects login missing the password (400 validation)", async () => {
    const res = await post("/restaurant_owner/login", { email: uniqueEmail() });
    assert.equal(res.statusCode, 400);
  });
});

describe("authentication enforcement", () => {
  it("rejects a protected route without a token (401)", async () => {
    const res = await get("/restaurant_owner/profile");
    assert.equal(res.statusCode, 401);
  });

  it("rejects a protected route with a garbage token (401)", async () => {
    const res = await get("/restaurant_owner/profile", "not.a.real.token");
    assert.equal(res.statusCode, 401);
  });

  it("allows a protected route with a valid token (200)", async () => {
    const { token, email } = await createOwner();
    const res = await get("/restaurant_owner/profile", token);
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().data.owner.email, email);
  });
});

describe("role enforcement", () => {
  it("blocks an owner token on a chef-only route (403)", async () => {
    const { token } = await createOwner({ withRestaurant: true });
    const res = await get("/chef/orders", token);
    assert.equal(res.statusCode, 403);
  });

  it("blocks a chef token on an owner-only route (403)", async () => {
    const { token } = await createOwner({ withRestaurant: true });
    const employeeId = uniqueEmployeeId();
    await post(
      "/restaurant_owner/employees",
      {
        role: "chef",
        name: "Cook",
        email: uniqueEmail(),
        employeeId,
        password: "chefpw99",
      },
      token,
    );
    const login = await post("/restaurant_owner/employees/login", {
      employeeId,
      password: "chefpw99",
    });
    const chefToken = login.json().data.token;
    assert.equal(login.json().data.portal, "/chef");

    const res = await get("/restaurant_owner/inventory", chefToken);
    assert.equal(res.statusCode, 403);
  });
});

describe("tenant isolation (no IDOR)", () => {
  it("scopes inventory to the caller's own restaurant", async () => {
    // Owner A registers a restaurant and adds an inventory item.
    const a = await createOwner({ withRestaurant: true });
    await post(
      "/restaurant_owner/add_inventory",
      { name: "Tomatoes", quantity: 10, unit: "kg", price: 50 },
      a.token,
    );

    const aInv = await get("/restaurant_owner/inventory", a.token);
    assert.equal(aInv.json().data.inventory.length, 1);

    // Owner B registers their own restaurant; must not see A's inventory.
    const b = await createOwner({ withRestaurant: true });
    const bInv = await get("/restaurant_owner/inventory", b.token);
    assert.equal(bInv.statusCode, 200);
    assert.equal(
      bInv.json().data.inventory.length,
      0,
      "owner B must not see owner A's inventory",
    );
  });
});

describe("rate limiting", () => {
  it("returns 429 once the limit is exceeded", async () => {
    process.env.RATE_LIMIT_MAX = "3";
    const rlApp = await buildApp({ logger: false, rateLimit: true });
    await rlApp.ready();

    try {
      const codes = [];
      for (let i = 0; i < 5; i++) {
        const res = await rlApp.inject({ method: "GET", url: "/health" });
        codes.push(res.statusCode);
      }
      assert.ok(
        codes.includes(429),
        `expected a 429 among responses, got ${codes.join(",")}`,
      );
    } finally {
      await rlApp.close();
      delete process.env.RATE_LIMIT_MAX;
    }
  });
});
