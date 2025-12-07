// main.js – RangeBrothers store (clean version)

document.addEventListener("DOMContentLoaded", () => {
  // =====================
  // CONFIG
  // =====================
  const WHATSAPP_NUMBER = "265997901410";
  const FACEBOOK_PAGE_URL = "https://facebook.com/"; // update later

  let allPhones = [];
  let cart = [];

  // =====================
  // HELPERS
  // =====================

  function formatMWK(amount) {
    return "MWK " + amount.toLocaleString("en-US");
  }

  function buildWhatsAppLink(phone, storageObj, colorObj) {
    const base = `https://wa.me/${WHATSAPP_NUMBER}`;
    const text =
      `Hi RangeBrothers, I'm interested in the ${phone.name} ` +
      `(${storageObj.size}, ${colorObj.name}) priced at ${formatMWK(
        storageObj.price_mwk
      )}. Is it available?`;
    return `${base}?text=${encodeURIComponent(text)}`;
  }

  function isStorageInStock(storageObj) {
    // later you can add "in_stock: false" in JSON if something is out
    return storageObj.in_stock !== false;
  }

  function getLowestPrice(phone) {
    return Math.min(...phone.storages.map((s) => s.price_mwk));
  }

  // =====================
  // LOAD PHONES.JSON
  // =====================

  async function loadPhones() {
    try {
      // cache-buster ?v=1 so GitHub Pages always picks latest version
      const res = await fetch("phones.json?v=1");
      const data = await res.json();
      allPhones = data;
      renderPhones(allPhones);
      initFiltersAndSorting();
    } catch (err) {
      console.error("Error loading phones.json:", err);
      const grid = document.getElementById("productsGrid");
      if (grid) {
        grid.innerHTML =
          "<p class='error-text'>Unable to load products right now. Please try again later.</p>";
      }
    }
  }

  // =====================
  // RENDER PRODUCT CARDS
  // =====================

  function renderPhones(phones) {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    grid.innerHTML = "";

    if (!phones.length) {
      grid.innerHTML = "<p class='muted'>No matching phones found.</p>";
      return;
    }

    phones.forEach((phone, phoneIndex) => {
      const card = document.createElement("article");
      card.className = "product-card";
      card.dataset.index = phoneIndex.toString();

      const defaultStorage = phone.storages[0];
      const defaultColor = defaultStorage.colors[0];
      const inStock = isStorageInStock(defaultStorage);

      card.innerHTML = `
        <div class="product-image-wrapper">
          <img src="${defaultColor.image}" 
               class="product-image" 
               alt="${phone.name}">
        </div>

        <div class="product-info">
          <h3 class="product-name">${phone.name}</h3>
          <div class="product-meta">
            <span class="selected-storage">${defaultStorage.size}</span>
            <span class="dot-separator"></span>
            <span class="badge badge-small">${
              inStock ? "Brand new • Imported" : "Out of stock"
            }</span>
          </div>
          <div class="product-price">${formatMWK(
            defaultStorage.price_mwk
          )}</div>
        </div>

        <div class="product-options">
          <label class="field">
            <span>Storage</span>
            <select class="storage-select">
              ${phone.storages
                .map(
                  (s, idx) =>
                    `<option value="${idx}">${s.size}${
                      isStorageInStock(s) ? "" : " (Out)"
                    }</option>`
                )
                .join("")}
            </select>
          </label>

          <div class="product-colors"></div>
        </div>

        <div class="product-actions">
          <button class="btn btn-primary wa-btn" type="button">WhatsApp</button>
          <button class="btn btn-outline quick-view-btn" type="button">Quick view</button>
          <button class="btn btn-ghost add-cart-btn" type="button">Add to cart</button>
        </div>
      `;

      grid.appendChild(card);

      // per-card wiring
      const img = card.querySelector(".product-image");
      const priceEl = card.querySelector(".product-price");
      const storageLabel = card.querySelector(".selected-storage");
      const storageSelect = card.querySelector(".storage-select");
      const colorsContainer = card.querySelector(".product-colors");
      const waBtn = card.querySelector(".wa-btn");
      const quickViewBtn = card.querySelector(".quick-view-btn");
      const addCartBtn = card.querySelector(".add-cart-btn");

      function getSelectedStorage() {
        return phone.storages[Number(storageSelect.value)];
      }

      function renderColors(storageObj, activeName = null) {
        colorsContainer.innerHTML = "";

        storageObj.colors.forEach((color, idx) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "color-dot";
          btn.style.backgroundImage = `radial-gradient(circle at 30% 30%, #fff3, #0000), url("${color.thumb ||
            color.image}")`;
          btn.title = color.name;

          if ((!activeName && idx === 0) || activeName === color.name) {
            btn.classList.add("active");
          }

          btn.addEventListener("click", () => {
            img.src = color.image;
            colorsContainer
              .querySelectorAll(".color-dot")
              .forEach((d) => d.classList.remove("active"));
            btn.classList.add("active");
            waBtn.dataset.href = buildWhatsAppLink(phone, storageObj, color);
          });

          colorsContainer.appendChild(btn);
        });

        // initial WA link
        const selectedColor =
          storageObj.colors.find((c) => c.name === activeName) ||
          storageObj.colors[0];
        img.src = selectedColor.image;
        waBtn.dataset.href = buildWhatsAppLink(phone, storageObj, selectedColor);
      }

      // initial
      renderColors(defaultStorage);

      storageSelect.addEventListener("change", () => {
        const s = getSelectedStorage();
        storageLabel.textContent = s.size;
        priceEl.textContent = formatMWK(s.price_mwk);
        renderColors(s);
      });

      waBtn.addEventListener("click", () => {
        // use data-href that we constantly keep updated
        const url = waBtn.dataset.href;
        if (url) window.open(url, "_blank");
      });

      quickViewBtn.addEventListener("click", () => {
        openQuickView(phoneIndex);
      });

      addCartBtn.addEventListener("click", () => {
        const s = getSelectedStorage();
        if (!isStorageInStock(s)) {
          alert("Sorry, this storage option is currently out of stock.");
          return;
        }
        const activeDot = colorsContainer.querySelector(".color-dot.active");
        const idx = Array.from(colorsContainer.children).indexOf(activeDot);
        const colorObj = s.colors[idx];
        addToCart(phone, s, colorObj);
      });
    });
  }

  // =====================
  // FILTERS + SORTING
  // =====================

  function initFiltersAndSorting() {
    const searchInput = document.getElementById("searchInput");
    const storageFilter = document.getElementById("storageFilter");
    const sortSelect = document.getElementById("sortSelect");

    function applyFilters() {
      const query = (searchInput?.value || "").toLowerCase().trim();
      const storageValue = storageFilter?.value || "";
      const sortValue = sortSelect?.value || "default";

      let filtered = allPhones.filter((p) => {
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesStorage =
          !storageValue || p.storages.some((s) => s.size === storageValue);
        return matchesName && matchesStorage;
      });

      if (sortValue === "price-asc") {
        filtered.sort((a, b) => getLowestPrice(a) - getLowestPrice(b));
      } else if (sortValue === "price-desc") {
        filtered.sort((a, b) => getLowestPrice(b) - getLowestPrice(a));
      }

      renderPhones(filtered);
    }

    if (searchInput) searchInput.addEventListener("input", applyFilters);
    if (storageFilter) storageFilter.addEventListener("change", applyFilters);
    if (sortSelect) sortSelect.addEventListener("change", applyFilters);
  }

  // =====================
  // QUICK VIEW MODAL
  // =====================

  const quickViewOverlay = document.getElementById("quickViewOverlay");
  const quickViewBody = document.getElementById("quickViewBody");
  const quickViewClose = document.getElementById("quickViewClose");

  function openQuickView(index) {
    const phone = allPhones[index];
    if (!phone || !quickViewOverlay || !quickViewBody) return;

    const defaultStorage = phone.storages[0];
    const defaultColor = defaultStorage.colors[0];

    quickViewBody.innerHTML = `
      <div class="qv-layout">
        <div class="qv-image-wrap">
          <img src="${defaultColor.image}" alt="${phone.name}" id="qvImage">
        </div>
        <div class="qv-info">
          <h3>${phone.name}</h3>
          <p class="muted">
            Brand new imported iPhones delivered in Malawi, with clear MWK pricing.
          </p>

          <div class="qv-price-line">
            <span>From</span>
            <strong id="qvPrice">${formatMWK(defaultStorage.price_mwk)}</strong>
          </div>

          <label class="field">
            <span>Storage</span>
            <select id="qvStorageSelect" class="storage-select">
              ${phone.storages
                .map(
                  (s, idx) =>
                    `<option value="${idx}">${s.size}${
                      isStorageInStock(s) ? "" : " (Out)"
                    }</option>`
                )
                .join("")}
            </select>
          </label>

          <div class="qv-colors-wrap">
            <span class="field-label">Color</span>
            <div id="qvColors" class="product-colors"></div>
          </div>

          <div class="qv-actions">
            <button id="qvAddCart" class="btn btn-primary">Add to cart</button>
            <a id="qvWaBtn" class="btn btn-outline" target="_blank">WhatsApp</a>
          </div>
        </div>
      </div>
    `;

    const img = document.getElementById("qvImage");
    const storageSelect = document.getElementById("qvStorageSelect");
    const colorsDiv = document.getElementById("qvColors");
    const priceEl = document.getElementById("qvPrice");
    const waBtn = document.getElementById("qvWaBtn");
    const addBtn = document.getElementById("qvAddCart");

    function getS() {
      return phone.storages[Number(storageSelect.value)];
    }

    function renderColorsQ(s, activeName = null) {
      colorsDiv.innerHTML = "";

      s.colors.forEach((c, idx) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "color-dot";
        b.style.backgroundImage = `radial-gradient(circle at 30% 30%, #fff3, #0000), url("${c.thumb ||
          c.image}")`;
        b.title = c.name;
        if ((!activeName && idx === 0) || activeName === c.name)
          b.classList.add("active");

        b.addEventListener("click", () => {
          img.src = c.image;
          colorsDiv
            .querySelectorAll(".color-dot")
            .forEach((x) => x.classList.remove("active"));
          b.classList.add("active");
          waBtn.href = buildWhatsAppLink(phone, s, c);
        });

        colorsDiv.appendChild(b);
      });

      const selected = s.colors.find((c) => c.name === activeName) || s.colors[0];
      img.src = selected.image;
      waBtn.href = buildWhatsAppLink(phone, s, selected);
    }

    renderColorsQ(defaultStorage);

    storageSelect.addEventListener("change", () => {
      const s = getS();
      priceEl.textContent = formatMWK(s.price_mwk);
      renderColorsQ(s);
    });

    addBtn.addEventListener("click", () => {
      const s = getS();
      const active = colorsDiv.querySelector(".color-dot.active");
      const idx = Array.from(colorsDiv.children).indexOf(active);
      const c = s.colors[idx];
      addToCart(phone, s, c);
    });

    quickViewOverlay.classList.add("visible");
  }

  if (quickViewClose && quickViewOverlay) {
    quickViewClose.addEventListener("click", () =>
      quickViewOverlay.classList.remove("visible")
    );
    quickViewOverlay.addEventListener("click", (e) => {
      if (e.target === quickViewOverlay) {
        quickViewOverlay.classList.remove("visible");
      }
    });
  }

  // =====================
  // CART SYSTEM
  // =====================

  const cartOverlay = document.getElementById("cartOverlay");
  const cartButton = document.getElementById("cartButton");
  const cartClose = document.getElementById("cartClose");
  const cartItemsDiv = document.getElementById("cartItems");
  const cartCount = document.getElementById("cartCount");
  const cartTotal = document.getElementById("cartTotal");
  const clearCart = document.getElementById("clearCart");
  const cartWa = document.getElementById("cartWhatsApp");

  if (cartButton && cartOverlay) {
    cartButton.addEventListener("click", () =>
      cartOverlay.classList.add("visible")
    );
  }
  if (cartClose && cartOverlay) {
    cartClose.addEventListener("click", () =>
      cartOverlay.classList.remove("visible")
    );
    cartOverlay.addEventListener("click", (e) => {
      if (e.target === cartOverlay) cartOverlay.classList.remove("visible");
    });
  }

  function addToCart(phone, storage, color) {
    cart.push({
      id: `${phone.id}-${storage.size}-${color.name}`.replace(/\s+/g, "-"),
      name: phone.name,
      storage: storage.size,
      color: color.name,
      price: storage.price_mwk,
    });
    updateCart();
  }

  function removeFromCart(id) {
    cart = cart.filter((item) => item.id !== id);
    updateCart();
  }

  if (clearCart) {
    clearCart.addEventListener("click", () => {
      cart = [];
      updateCart();
    });
  }

  function updateCart() {
    if (!cartItemsDiv || !cartTotal || !cartCount || !cartWa) return;

    cartItemsDiv.innerHTML = "";

    if (!cart.length) {
      cartItemsDiv.innerHTML = "<p class='muted'>Your cart is empty.</p>";
      cartCount.textContent = "0";
      cartTotal.textContent = "MWK 0";
      cartWa.href = "#";
      return;
    }

    cart.forEach((item) => {
      const d = document.createElement("div");
      d.className = "cart-item";
      d.innerHTML = `
        <div class="cart-item-main">
          <strong>${item.name}</strong>
          <span class="cart-item-meta">${item.storage} • ${item.color}</span>
        </div>
        <div class="cart-item-side">
          <span class="cart-item-price">${formatMWK(item.price)}</span>
          <button class="link-btn cart-item-remove" type="button">Remove</button>
        </div>
      `;
      d.querySelector(".cart-item-remove").addEventListener("click", () =>
        removeFromCart(item.id)
      );
      cartItemsDiv.appendChild(d);
    });

    cartCount.textContent = String(cart.length);
    const total = cart.reduce((t, i) => t + i.price, 0);
    cartTotal.textContent = formatMWK(total);

    const waText =
      "Hi RangeBrothers, I want to order:\n\n" +
      cart
        .map(
          (i, idx) =>
            `${idx + 1}. ${i.name} (${i.storage}, ${i.color}) - ${formatMWK(
              i.price
            )}`
        )
        .join("\n") +
      `\n\nTotal: ${cartTotal.textContent}`;

    cartWa.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      waText
    )}`;
  }

  // =====================
  // FOOTER YEAR
  // =====================

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // =====================
  // START
  // =====================
  loadPhones();
});
