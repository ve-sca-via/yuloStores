// Fastify JSON schemas for request validation. Invalid requests are rejected
// with a 400 before reaching the controller.
//
// Note: additionalProperties is intentionally left permissive. The client still
// sends some now-ignored fields (e.g. ownerId, restaurantId) in request bodies;
// the server derives identity from the JWT, so those extras are simply ignored
// rather than rejected. Required fields and types are still enforced.

const EMAIL_PATTERN = "^\\S+@\\S+\\.\\S+$";

const ownerSignup = {
  body: {
    type: "object",
    required: ["name", "email", "password"],
    properties: {
      name: { type: "string", minLength: 1, maxLength: 120 },
      email: { type: "string", minLength: 3, maxLength: 254, pattern: EMAIL_PATTERN },
      password: { type: "string", minLength: 6, maxLength: 200 },
    },
  },
};

const ownerLogin = {
  body: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", minLength: 3, maxLength: 254 },
      password: { type: "string", minLength: 1, maxLength: 200 },
    },
  },
};

const ownerProfileUpdate = {
  body: {
    type: "object",
    required: ["name", "email"],
    properties: {
      name: { type: "string", minLength: 1, maxLength: 120 },
      email: { type: "string", minLength: 3, maxLength: 254, pattern: EMAIL_PATTERN },
      password: { type: "string", maxLength: 200 },
    },
  },
};

const employeeLogin = {
  body: {
    type: "object",
    required: ["employeeId", "password"],
    properties: {
      employeeId: { type: "string", minLength: 1, maxLength: 80 },
      password: { type: "string", minLength: 1, maxLength: 200 },
    },
  },
};

const addEmployee = {
  body: {
    type: "object",
    required: ["role", "employeeId", "password"],
    properties: {
      role: { type: "string", enum: ["chef", "waiter"] },
      employeeId: { type: "string", minLength: 1, maxLength: 80 },
      password: { type: "string", minLength: 6, maxLength: 200 },
      name: { type: "string", maxLength: 120 },
      email: { type: "string", maxLength: 254 },
    },
  },
};

const addStaffMember = {
  body: {
    type: "object",
    required: ["role", "name", "email"],
    properties: {
      role: { type: "string", enum: ["chef", "waiter"] },
      name: { type: "string", minLength: 1, maxLength: 120 },
      email: { type: "string", minLength: 3, maxLength: 254, pattern: EMAIL_PATTERN },
    },
  },
};

const restaurantName = {
  body: {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string", minLength: 1, maxLength: 160 },
    },
  },
};

const addItem = {
  body: {
    type: "object",
    properties: {
      title: { type: "string", maxLength: 160 },
      price: { type: ["number", "string"] },
      ingredients: { type: "array", items: { type: "string" } },
      recipes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string", maxLength: 160 },
            price: { type: ["number", "string"] },
            ingredients: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
  },
};

const addExpense = {
  body: {
    type: "object",
    required: ["amount"],
    properties: {
      title: { type: "string", maxLength: 160 },
      name: { type: "string", maxLength: 160 },
      amount: { type: ["number", "string"] },
      note: { type: "string", maxLength: 1000 },
      tags: { type: ["array", "string"] },
      tag: { type: "string", maxLength: 80 },
    },
  },
};

const addInventory = {
  body: {
    type: "object",
    properties: {
      name: { type: "string", maxLength: 160 },
      quantity: { type: ["number", "string"] },
      unit: { type: "string", maxLength: 40 },
      price: { type: ["number", "string"] },
      available: { type: "boolean" },
      items: { type: "array" },
    },
  },
};

const inventoryMovement = {
  body: {
    type: "object",
    required: ["type", "quantity"],
    properties: {
      type: {
        type: "string",
        enum: ["restock", "usage", "waste", "manual_adjustment"],
      },
      quantity: { type: ["number", "string"] },
      note: { type: "string", maxLength: 1000 },
    },
  },
};

const generateQr = {
  body: {
    type: "object",
    required: ["tableNumber"],
    properties: {
      tableNumber: { type: ["string", "number"] },
      baseUrl: { type: "string", maxLength: 500 },
      size: { type: "string", maxLength: 20 },
    },
  },
};

const orderItems = {
  type: "array",
  minItems: 1,
  items: {
    type: "object",
    required: ["recipeId", "quantity"],
    properties: {
      recipeId: { type: "string", minLength: 1 },
      quantity: { type: ["number", "string"] },
    },
  },
};

const createOrder = {
  body: {
    type: "object",
    required: ["restaurantId", "items"],
    properties: {
      restaurantId: { type: "string", minLength: 1 },
      tableNumber: { type: ["string", "number"] },
      items: orderItems,
    },
  },
};

const waiterOrder = {
  body: {
    type: "object",
    required: ["tableNumber", "items"],
    properties: {
      tableNumber: { type: ["string", "number"] },
      items: orderItems,
    },
  },
};

const updatePayment = {
  body: {
    type: "object",
    required: ["paymentStatus"],
    properties: {
      paymentStatus: { type: "string", enum: ["paid"] },
    },
  },
};

const chefOrderStatus = {
  body: {
    type: "object",
    required: ["orderStatus"],
    properties: {
      orderStatus: {
        type: "string",
        enum: ["preparing", "completed", "cancelled"],
      },
    },
  },
};

export default {
  ownerSignup,
  ownerLogin,
  ownerProfileUpdate,
  employeeLogin,
  addEmployee,
  addStaffMember,
  restaurantName,
  addItem,
  addExpense,
  addInventory,
  inventoryMovement,
  generateQr,
  createOrder,
  waiterOrder,
  updatePayment,
  chefOrderStatus,
};
