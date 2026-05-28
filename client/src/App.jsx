import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";

const OWNER_STORAGE_KEY = "yulo_owner_session";

function readStoredOwner() {
  try {
    const rawValue = window.localStorage.getItem(OWNER_STORAGE_KEY);

    return rawValue ? JSON.parse(rawValue) : null;
  } catch (_error) {
    return null;
  }
}

function storeOwner(owner) {
  if (!owner) {
    window.localStorage.removeItem(OWNER_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(OWNER_STORAGE_KEY, JSON.stringify(owner));
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json();

  if (!response.ok || payload?.status === "error") {
    throw new Error(payload?.message || "Request failed");
  }

  return payload;
}

function normalizeOwner(owner) {
  if (!owner) {
    return null;
  }

  const restaurant = owner.restaurant
    ? typeof owner.restaurant === "string"
      ? { id: owner.restaurant }
      : {
          id: owner.restaurant._id ?? owner.restaurant.id,
          name: owner.restaurant.name,
          owner: owner.restaurant.owner,
          recipies: owner.restaurant.recipies ?? [],
        }
    : null;

  return {
    id: owner._id ?? owner.id,
    name: owner.name,
    email: owner.email,
    restaurant,
  };
}

function formatPrice(price) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

function hashString(input) {
  return Array.from(input).reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );
}

function applyRestaurantTheme(restaurant) {
  const themes = [
    {
      bg: "linear-gradient(135deg, #f7f1e8 0%, #efe3d0 50%, #d7c3a7 100%)",
      surface: "rgba(255, 252, 247, 0.78)",
      surfaceStrong: "#fffaf2",
      text: "#2a2118",
      muted: "#6e5b48",
      accent: "#b85c38",
      accentSoft: "rgba(184, 92, 56, 0.12)",
      border: "rgba(63, 40, 19, 0.1)",
      shadow: "0 24px 70px rgba(62, 35, 10, 0.15)",
    },
    {
      bg: "linear-gradient(135deg, #eef6f2 0%, #d6eadf 55%, #a7ccb9 100%)",
      surface: "rgba(247, 255, 251, 0.8)",
      surfaceStrong: "#f9fffb",
      text: "#10241c",
      muted: "#476457",
      accent: "#1f7a5c",
      accentSoft: "rgba(31, 122, 92, 0.14)",
      border: "rgba(16, 36, 28, 0.1)",
      shadow: "0 24px 70px rgba(20, 73, 56, 0.14)",
    },
    {
      bg: "linear-gradient(135deg, #f4ede7 0%, #ead2be 50%, #cda27e 100%)",
      surface: "rgba(255, 249, 244, 0.78)",
      surfaceStrong: "#fffaf5",
      text: "#2f1c11",
      muted: "#76533d",
      accent: "#c06a2b",
      accentSoft: "rgba(192, 106, 43, 0.14)",
      border: "rgba(47, 28, 17, 0.1)",
      shadow: "0 24px 70px rgba(101, 52, 19, 0.14)",
    },
    {
      bg: "linear-gradient(135deg, #f1f2f8 0%, #d9def0 52%, #a9b4da 100%)",
      surface: "rgba(251, 252, 255, 0.78)",
      surfaceStrong: "#ffffff",
      text: "#182033",
      muted: "#596683",
      accent: "#3454d1",
      accentSoft: "rgba(52, 84, 209, 0.12)",
      border: "rgba(24, 32, 51, 0.1)",
      shadow: "0 24px 70px rgba(37, 59, 141, 0.15)",
    },
  ];

  const key = `${restaurant?.id ?? ""}${restaurant?.name ?? ""}`;
  const theme = themes[hashString(key) % themes.length];
  const root = document.documentElement;

  root.style.setProperty("--bg", theme.bg);
  root.style.setProperty("--surface", theme.surface);
  root.style.setProperty("--surface-strong", theme.surfaceStrong);
  root.style.setProperty("--text", theme.text);
  root.style.setProperty("--muted", theme.muted);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-soft", theme.accentSoft);
  root.style.setProperty("--border", theme.border);
  root.style.setProperty("--shadow", theme.shadow);
}

function AppShell({ children }) {
  const location = useLocation();
  const isOwnerPortal = location.pathname.startsWith("/owner");

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to={isOwnerPortal ? "/owner" : "/menu"}>
          Yulo Stores
        </Link>
        <nav className="topnav">
          <Link to="/owner">Owner Portal</Link>
          <Link to="/menu">QR Menu</Link>
        </nav>
      </header>
      {children}
    </div>
  );
}

function AuthCard({
  mode,
  form,
  onChange,
  onModeChange,
  onSubmit,
  loading,
  status,
}) {
  return (
    <section className="panel auth-panel">
      <div className="panel-heading">
        <div>
          <p className="section-label">Restaurant Owner</p>
          <h1>
            {mode === "login"
              ? "Sign in to manage your restaurant"
              : "Create your owner account"}
          </h1>
        </div>
        <p className="status-text">{status}</p>
      </div>

      <div className="segmented-control">
        <button
          className={mode === "login" ? "active" : ""}
          type="button"
          onClick={() => onModeChange("login")}
        >
          Login
        </button>
        <button
          className={mode === "signup" ? "active" : ""}
          type="button"
          onClick={() => onModeChange("signup")}
        >
          Signup
        </button>
      </div>

      <form className="stack-form" onSubmit={onSubmit}>
        {mode === "signup" ? (
          <label>
            <span>Name</span>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="Owner name"
              required
            />
          </label>
        ) : null}
        <label>
          <span>Email</span>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            placeholder="owner@restaurant.com"
            required
          />
        </label>
        <label>
          <span>Password</span>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            placeholder="Enter password"
            required
          />
        </label>
        <button className="primary-button" type="submit" disabled={loading}>
          {loading
            ? "Submitting..."
            : mode === "login"
              ? "Login"
              : "Create Account"}
        </button>
      </form>
    </section>
  );
}

function OwnerPortalPage() {
  const [owner, setOwner] = useState(() => readStoredOwner());
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [authStatus, setAuthStatus] = useState("Login or signup to continue");
  const [authLoading, setAuthLoading] = useState(false);
  const [restaurantName, setRestaurantName] = useState("");
  const [itemForm, setItemForm] = useState({
    title: "",
    ingredients: "",
    price: "",
  });
  const [qrForm, setQrForm] = useState({
    tableNumber: "",
    baseUrl: typeof window !== "undefined" ? window.location.origin : "",
  });
  const [menuItems, setMenuItems] = useState([]);
  const [ordersData, setOrdersData] = useState({ totalOrders: 0, orders: [] });
  const [portalStatus, setPortalStatus] = useState("Waiting for owner actions");
  const [qrData, setQrData] = useState(null);

  async function refreshRestaurantMenu(restaurantId) {
    if (!restaurantId) {
      return;
    }

    const payload = await requestJson(`/api/restaurants/${restaurantId}/menu`);
    setMenuItems(payload.data.restaurant.recipies ?? []);
  }

  async function refreshOrders(restaurantId) {
    if (!restaurantId) {
      return;
    }

    const payload = await requestJson(
      `/restaurant_owner/orders?restaurant_id=${restaurantId}`,
    );
    setOrdersData({
      totalOrders: payload.data.totalOrders,
      orders: payload.data.orders,
    });
  }

  useEffect(() => {
    storeOwner(owner);
  }, [owner]);

  useEffect(() => {
    if (!owner?.restaurant?.id) {
      return;
    }

    refreshRestaurantMenu(owner.restaurant.id).catch((error) =>
      setPortalStatus(error.message),
    );
    refreshOrders(owner.restaurant.id).catch((error) =>
      setPortalStatus(error.message),
    );
  }, [owner?.restaurant?.id]);

  function handleAuthInputChange(event) {
    const { name, value } = event.target;
    setAuthForm((current) => ({ ...current, [name]: value }));
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthLoading(true);

    try {
      const endpoint =
        authMode === "login"
          ? "/restaurant_owner/login"
          : "/restaurant_owner/signup";
      const payload = await requestJson(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(authForm),
      });

      const nextOwner = normalizeOwner(payload.data.owner);
      setOwner(nextOwner);
      setAuthStatus(payload.message);
      setPortalStatus("Owner authenticated successfully");
      setAuthForm({ name: "", email: "", password: "" });
    } catch (error) {
      setAuthStatus(error.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRestaurantRegister(event) {
    event.preventDefault();

    if (!owner?.id) {
      return;
    }

    try {
      const payload = await requestJson(
        "/restaurant_owner/register_restaurant",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ownerId: owner.id,
            name: restaurantName,
          }),
        },
      );

      setOwner((current) => ({
        ...current,
        restaurant: payload.data.restaurant,
      }));
      setRestaurantName("");
      setPortalStatus(payload.message);
    } catch (error) {
      setPortalStatus(error.message);
    }
  }

  async function handleAddItem(event) {
    event.preventDefault();

    if (!owner?.id) {
      return;
    }

    try {
      const payload = await requestJson("/restaurant_owner/add_item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ownerId: owner.id,
          title: itemForm.title,
          ingredients: itemForm.ingredients
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
          price: Number(itemForm.price),
        }),
      });

      setPortalStatus(payload.message);
      setItemForm({ title: "", ingredients: "", price: "" });
      await refreshRestaurantMenu(payload.data.restaurantId);
    } catch (error) {
      setPortalStatus(error.message);
    }
  }

  async function handleGenerateQr(event) {
    event.preventDefault();

    if (!owner?.id) {
      return;
    }

    try {
      const payload = await requestJson("/restaurant_owner/generate_qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ownerId: owner.id,
          tableNumber: qrForm.tableNumber,
          baseUrl: qrForm.baseUrl,
        }),
      });

      setQrData(payload.data);
      setPortalStatus(payload.message);
    } catch (error) {
      setPortalStatus(error.message);
    }
  }

  async function handleRefreshOrders() {
    if (!owner?.restaurant?.id) {
      return;
    }

    try {
      await refreshOrders(owner.restaurant.id);
      setPortalStatus("Orders refreshed");
    } catch (error) {
      setPortalStatus(error.message);
    }
  }

  function handleLogout() {
    setOwner(null);
    setMenuItems([]);
    setOrdersData({ totalOrders: 0, orders: [] });
    setQrData(null);
    setPortalStatus("Logged out");
  }

  if (!owner) {
    return (
      <main className="page-shell owner-shell">
        <AuthCard
          mode={authMode}
          form={authForm}
          onChange={handleAuthInputChange}
          onModeChange={setAuthMode}
          onSubmit={handleAuthSubmit}
          loading={authLoading}
          status={authStatus}
        />
      </main>
    );
  }

  return (
    <main className="page-shell owner-shell">
      <section className="hero-card owner-hero">
        <div>
          <p className="section-label">Owner Dashboard</p>
          <h1>{owner.name}</h1>
          <p className="hero-text">
            {owner.email}
            {owner.restaurant?.name
              ? ` • ${owner.restaurant.name}`
              : " • No restaurant registered yet"}
          </p>
        </div>
        <div className="hero-actions">
          <span className="badge ghost">{portalStatus}</span>
          <button
            className="secondary-button"
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </section>

      {!owner.restaurant?.id ? (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">Restaurant Setup</p>
              <h2>Register your restaurant</h2>
            </div>
          </div>
          <form className="stack-form" onSubmit={handleRestaurantRegister}>
            <label>
              <span>Restaurant name</span>
              <input
                value={restaurantName}
                onChange={(event) => setRestaurantName(event.target.value)}
                placeholder="Enter restaurant name"
                required
              />
            </label>
            <button className="primary-button" type="submit">
              Register Restaurant
            </button>
          </form>
        </section>
      ) : (
        <section className="owner-grid">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="section-label">Menu Items</p>
                <h2>Add a dish</h2>
              </div>
              <p className="status-text">{menuItems.length} listed</p>
            </div>

            <form className="stack-form" onSubmit={handleAddItem}>
              <label>
                <span>Dish title</span>
                <input
                  value={itemForm.title}
                  onChange={(event) =>
                    setItemForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Paneer Tikka"
                  required
                />
              </label>
              <label>
                <span>Ingredients</span>
                <input
                  value={itemForm.ingredients}
                  onChange={(event) =>
                    setItemForm((current) => ({
                      ...current,
                      ingredients: event.target.value,
                    }))
                  }
                  placeholder="Paneer, Spices"
                />
              </label>
              <label>
                <span>Price</span>
                <input
                  type="number"
                  min="0"
                  value={itemForm.price}
                  onChange={(event) =>
                    setItemForm((current) => ({
                      ...current,
                      price: event.target.value,
                    }))
                  }
                  placeholder="250"
                  required
                />
              </label>
              <button className="primary-button" type="submit">
                Add Item
              </button>
            </form>

            <div className="owner-list">
              {menuItems.length === 0 ? (
                <p className="empty-state">No menu items added yet.</p>
              ) : (
                menuItems.map((item) => (
                  <article className="owner-list-item" key={item.id}>
                    <div>
                      <h3>{item.title}</h3>
                      <p>
                        {item.ingredients?.join(" • ") ||
                          "Ingredients will be updated soon"}
                      </p>
                    </div>
                    <strong>{formatPrice(item.price)}</strong>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="section-label">QR Generator</p>
                <h2>Create table link</h2>
              </div>
            </div>

            <form className="stack-form" onSubmit={handleGenerateQr}>
              <label>
                <span>Table number</span>
                <input
                  value={qrForm.tableNumber}
                  onChange={(event) =>
                    setQrForm((current) => ({
                      ...current,
                      tableNumber: event.target.value,
                    }))
                  }
                  placeholder="4"
                  required
                />
              </label>
              <label>
                <span>Base URL</span>
                <input
                  value={qrForm.baseUrl}
                  onChange={(event) =>
                    setQrForm((current) => ({
                      ...current,
                      baseUrl: event.target.value,
                    }))
                  }
                  placeholder="http://localhost:3000"
                  required
                />
              </label>
              <button className="primary-button" type="submit">
                Generate QR
              </button>
            </form>

            {qrData ? (
              <div className="qr-result">
                <img
                  src={qrData.qrImageUrl}
                  alt={`QR code for table ${qrData.tableNumber}`}
                />
                <a href={qrData.link} target="_blank" rel="noreferrer">
                  {qrData.link}
                </a>
              </div>
            ) : null}
          </section>

          <section className="panel owner-orders">
            <div className="panel-heading">
              <div>
                <p className="section-label">Order Stream</p>
                <h2>Incoming orders</h2>
              </div>
              <button
                className="secondary-button"
                type="button"
                onClick={handleRefreshOrders}
              >
                Refresh
              </button>
            </div>

            <p className="status-text">{ordersData.totalOrders} total orders</p>

            <div className="owner-list">
              {ordersData.orders.length === 0 ? (
                <p className="empty-state">
                  No orders yet for this restaurant.
                </p>
              ) : (
                ordersData.orders.map((order) => (
                  <article className="order-card" key={order.id}>
                    <div className="order-card-head">
                      <div>
                        <h3>Order {order.id.slice(-6)}</h3>
                        <p>
                          {order.tableNumber
                            ? `Table ${order.tableNumber}`
                            : "No table number"}{" "}
                          • {new Date(order.time).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <span className="badge">{order.paymentStatus}</span>
                    </div>
                    <div className="order-lines">
                      {order.items.map((item) => (
                        <div
                          className="order-line"
                          key={`${order.id}-${item.recipeId}`}
                        >
                          <span>
                            {item.title} x {item.quantity}
                          </span>
                          <strong>{formatPrice(item.lineTotal)}</strong>
                        </div>
                      ))}
                    </div>
                    <div className="order-total-row">
                      <span>Total</span>
                      <strong>{formatPrice(order.totalPrice)}</strong>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </section>
      )}
    </main>
  );
}

function CustomerMenuPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const restaurantId = searchParams.get("restaurantId");
  const tableNumber = searchParams.get("tableNumber");
  const [status, setStatus] = useState("Loading menu...");
  const [restaurant, setRestaurant] = useState(null);
  const [selectedQuantities, setSelectedQuantities] = useState({});
  const [orderStatus, setOrderStatus] = useState("Select dishes to continue");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!restaurantId) {
      setStatus("Missing restaurantId in the menu URL.");
      return;
    }

    requestJson(`/api/restaurants/${restaurantId}/menu`)
      .then((payload) => {
        setRestaurant(payload.data.restaurant);
        setStatus("Freshly loaded from the restaurant record");
        applyRestaurantTheme(payload.data.restaurant);
      })
      .catch((error) => setStatus(error.message));
  }, [restaurantId]);

  const recipes = restaurant?.recipies ?? [];
  const selectedItems = recipes
    .map((item) => ({
      ...item,
      quantity: selectedQuantities[item.id] ?? 0,
    }))
    .filter((item) => item.quantity > 0);
  const totalPrice = selectedItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  function updateQuantity(recipeId, nextQuantity) {
    setSelectedQuantities((current) => {
      const nextState = { ...current };

      if (nextQuantity <= 0) {
        delete nextState[recipeId];
      } else {
        nextState[recipeId] = nextQuantity;
      }

      return nextState;
    });
  }

  async function placeOrder() {
    if (!restaurant || selectedItems.length === 0) {
      return;
    }

    setSubmitting(true);
    setOrderStatus("Submitting order...");

    try {
      const payload = await requestJson("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableNumber,
          items: selectedItems.map((item) => ({
            recipeId: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      setSelectedQuantities({});
      setOrderStatus(
        `Order placed at ${new Date(payload.data.order.time).toLocaleTimeString(
          "en-IN",
          {
            hour: "2-digit",
            minute: "2-digit",
          },
        )}`,
      );
    } catch (error) {
      setOrderStatus(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!restaurant) {
    return (
      <main className="page-shell menu-shell">
        <section className="hero-card">
          <p className="section-label">Digital Menu</p>
          <h1>Menu unavailable</h1>
          <p className="hero-text">{status}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell menu-shell">
      <section className="hero-card">
        <p className="section-label">Digital Menu</p>
        <div className="hero-header">
          <div>
            <h1>{restaurant.name}</h1>
            <p className="hero-text">
              {recipes.length} handpicked dishes currently listed for this
              restaurant.
            </p>
          </div>
          <div className="menu-badges">
            {tableNumber ? (
              <span className="badge">Table {tableNumber}</span>
            ) : null}
            <span className="badge ghost">
              {recipes.length} item{recipes.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </section>

      <section className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">Today&apos;s Spread</p>
              <h2>Menu Highlights</h2>
            </div>
            <p className="status-text">{status}</p>
          </div>

          <div className="menu-grid">
            {recipes.length === 0 ? (
              <p className="empty-state">
                No dishes added yet for this restaurant.
              </p>
            ) : (
              recipes.map((item) => {
                const quantity = selectedQuantities[item.id] ?? 0;

                return (
                  <article className="dish-card" key={item.id}>
                    <div className="dish-head">
                      <div>
                        <h3 className="dish-title">{item.title}</h3>
                        <p className="ingredients">
                          {item.ingredients?.join(" • ") ||
                            "Ingredients will be updated soon"}
                        </p>
                      </div>
                      <span className="price-pill">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                    <div className="quantity-row">
                      <p className="price-note">
                        Prepared for dine-in ordering.
                      </p>
                      <div className="quantity-controls">
                        <button
                          className="quantity-button"
                          type="button"
                          onClick={() => updateQuantity(item.id, quantity - 1)}
                        >
                          -
                        </button>
                        <span className="quantity-value">{quantity}</span>
                        <button
                          className="quantity-button"
                          type="button"
                          onClick={() => updateQuantity(item.id, quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <aside className="panel order-panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">Your Order</p>
              <h2>Cart Summary</h2>
            </div>
            <p className="status-text">{orderStatus}</p>
          </div>

          {selectedItems.length === 0 ? (
            <p className="empty-state">No items selected yet.</p>
          ) : (
            <div className="owner-list">
              {selectedItems.map((item) => (
                <article className="owner-list-item" key={item.id}>
                  <div>
                    <h3>{item.title}</h3>
                    <p>
                      {item.quantity} x {formatPrice(item.price)}
                    </p>
                  </div>
                  <strong>{formatPrice(item.quantity * item.price)}</strong>
                </article>
              ))}
            </div>
          )}

          <div className="order-total-row">
            <span>Total</span>
            <strong>{formatPrice(totalPrice)}</strong>
          </div>

          <button
            className="primary-button place-order-button"
            type="button"
            onClick={placeOrder}
            disabled={selectedItems.length === 0 || submitting}
          >
            {submitting ? "Submitting..." : "Place Order"}
          </button>
        </aside>
      </section>
    </main>
  );
}

function HomePage() {
  return (
    <main className="page-shell home-shell">
      <section className="hero-card landing-card">
        <p className="section-label">React + Vite Client</p>
        <h1>Restaurant owner tools and QR ordering in one client.</h1>
        <p className="hero-text">
          Use the owner portal to register restaurants, add dishes, generate
          table QR links, and review orders. The customer menu route keeps the
          same QR flow.
        </p>
        <div className="landing-actions">
          <Link className="primary-button link-button" to="/owner">
            Open Owner Portal
          </Link>
          <Link className="secondary-button link-button" to="/menu">
            Open Menu Route
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/owner" element={<OwnerPortalPage />} />
        <Route path="/menu" element={<CustomerMenuPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
