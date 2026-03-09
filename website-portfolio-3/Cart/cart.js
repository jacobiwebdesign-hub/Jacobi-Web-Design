(() => {
  const CART_KEY = "obsidianCart";
  const TAX_RATE = 0.08;
  const SHIPPING_LABEL = "Free";
  const TOAST_DURATION = 1800;

  function getCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (error) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function formatCurrency(value) {
    const amount = Number.isFinite(Number(value)) ? Number(value) : 0;
    const rounded = Math.round(amount * 100) / 100;
    return Number.isInteger(rounded) ? `$${rounded}` : `$${rounded.toFixed(2)}`;
  }

  function updateCartBadges(cart = getCart()) {
    const count = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    document.querySelectorAll("[data-cart-count]").forEach((node) => {
      node.textContent = String(count);
    });

    document.querySelectorAll("[data-cart-subtotal]").forEach((node) => {
      node.textContent = formatCurrency(subtotal);
    });

    document.querySelectorAll("[data-cart-tax]").forEach((node) => {
      node.textContent = formatCurrency(tax);
    });

    document.querySelectorAll("[data-cart-total]").forEach((node) => {
      node.textContent = formatCurrency(total);
    });

    document.querySelectorAll("[data-cart-shipping]").forEach((node) => {
      node.textContent = SHIPPING_LABEL;
    });
  }

  function readProduct(button) {
    const id = button.dataset.id ? button.dataset.id.trim() : "";
    const name = button.dataset.name ? button.dataset.name.trim() : "";
    const price = Number(button.dataset.price);
    const category = button.dataset.category ? button.dataset.category.trim() : "";
    const image = button.dataset.image ? button.dataset.image.trim() : "";
    const description = button.dataset.description ? button.dataset.description.trim() : "";

    if (!id || !name || !Number.isFinite(price)) return null;

    return {
      id,
      name,
      price,
      category,
      image,
      description,
    };
  }

  function getCartToast() {
    const toast = document.querySelector(".cart-toast");

    if (toast) {
      return toast;
    }

    const nextToast = document.createElement("div");
    nextToast.className = "cart-toast";
    nextToast.setAttribute("aria-live", "polite");
    document.body.appendChild(nextToast);
    return nextToast;
  }

  function showAddToCartMessage(productName) {
    const toast = getCartToast();
    toast.textContent = `${productName} added to cart`;

    clearTimeout(showAddToCartMessage.hideTimer);
    clearTimeout(showAddToCartMessage.fadeTimer);

    requestAnimationFrame(() => {
      toast.classList.remove("is-hiding");
      toast.classList.add("show");
    });

    showAddToCartMessage.fadeTimer = setTimeout(() => {
      toast.classList.add("is-hiding");
      toast.classList.remove("show");
    }, TOAST_DURATION);

    showAddToCartMessage.hideTimer = setTimeout(() => {
      toast.classList.remove("is-hiding");
    }, TOAST_DURATION + 250);
  }

  function addToCart(product) {
    const cart = getCart();
    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...product, qty: 1 });
    }

    saveCart(cart);
    updateCartBadges(cart);
    showAddToCartMessage(product.name);
  }

  function removeFromCart(id) {
    const cart = getCart();
    const nextCart = cart.filter((item) => item.id !== id);
    saveCart(nextCart);
    updateCartBadges(nextCart);
    return nextCart;
  }

  function changeQuantity(id, delta) {
    const cart = getCart();
    const item = cart.find((entry) => entry.id === id);

    if (!item) {
      return cart;
    }

    if (delta > 0) {
      item.qty += 1;
    } else if (delta < 0 && item.qty > 1) {
      item.qty -= 1;
    }

    saveCart(cart);
    updateCartBadges(cart);
    return cart;
  }

  function clearCart() {
    saveCart([]);
    updateCartBadges([]);
  }

  function renderCartItem(item) {
    return `
      <article class="cart-item">
        <div class="cart-item__media">
          <img src="${item.image}" alt="${item.name}" />
        </div>
        <div class="cart-item__body">
          <div class="cart-item__top">
            <div>
              <p class="cart-item__category">${item.category}</p>
              <h3>${item.name}</h3>
            </div>
            <strong>${formatCurrency(item.price)}</strong>
          </div>
          <p class="cart-item__desc">${item.description || "Premium OBSIDIAN product."}</p>
          <div class="cart-item__actions">
            <div class="qty-control">
              <button type="button" data-action="decrease" data-id="${item.id}" aria-label="Decrease quantity">-</button>
              <span>${item.qty}</span>
              <button type="button" data-action="increase" data-id="${item.id}" aria-label="Increase quantity">+</button>
            </div>
            <button type="button" class="remove-link" data-action="remove" data-id="${item.id}">Remove</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderCart() {
    const cart = getCart();
    const list = document.getElementById("cart-items");
    const empty = document.getElementById("cart-empty");

    if (!list) {
      updateCartBadges(cart);
      return;
    }

    list.innerHTML = "";
    updateCartBadges(cart);

    if (!empty) {
      return;
    }

    if (!cart.length) {
      empty.hidden = false;
      return;
    }

    empty.hidden = true;
    cart.forEach((item) => {
      list.insertAdjacentHTML("beforeend", renderCartItem(item));
    });
  }

  function handleAddToCart(event) {
    const button = event.target.closest(".add-to-cart");
    if (!button) return;

    const product = readProduct(button);
    if (!product) return;

    event.preventDefault();
    addToCart(product);
  }

  function handleCartActions(event) {
    if (event.target.id === "clear-cart") {
      event.preventDefault();
      clearCart();
      renderCart();
      return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;

    const action = actionButton.dataset.action;
    const id = actionButton.dataset.id;

    if (action === "increase") {
      changeQuantity(id, 1);
      renderCart();
      return;
    }

    if (action === "decrease") {
      changeQuantity(id, -1);
      renderCart();
      return;
    }

    if (action === "remove") {
      removeFromCart(id);
      renderCart();
    }
  }

  function init() {
    const hasAddButtons = document.querySelectorAll(".add-to-cart").length > 0;
    const hasCartPage = document.getElementById("cart-items") !== null;
    const hasBadges = document.querySelectorAll("[data-cart-count]").length > 0;

    if (hasAddButtons || hasCartPage || hasBadges) {
      updateCartBadges();
    }

    if (hasCartPage) {
      renderCart();
    }

    if (hasAddButtons) {
      document.addEventListener("click", handleAddToCart);
    }

    if (hasCartPage || hasBadges) {
      document.addEventListener("click", handleCartActions);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
