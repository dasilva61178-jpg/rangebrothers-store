/****************************************************
 * RangeBrothers Main Script – FINAL STABLE BUILD
 ****************************************************/

document.addEventListener("DOMContentLoaded", () => {

  // ======================
  // CONFIG
  // ======================

  const WHATSAPP_NUMBER = "265997901410";
  const FACEBOOK_PAGE_URL = "https://facebook.com/";
  let allPhones = [];
  let cart = [];


  // ======================
  // HELPER FUNCTIONS
  // ======================

  function formatMWK(amount) {
    return "MWK " + amount.toLocaleString("en-US");
  }

  function buildWhatsAppLink(phone, storage, color) {
    const msg =
      `Hi RangeBrothers, I'm interested in the ${phone.name} ` +
      `(${storage.size}, ${color.name}) priced at ${formatMWK(storage.price_mwk)}.`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  }


  // ======================
  // LOAD PHONES.JSON
  // ======================

  async function loadPhones() {
    try {
      const res = await fetch("phones.json?v=1");
      const data = await res.json();
      allPhones = data;
      renderPhones(allPhones);
    } catch (err) {
      console.error("PHONE LOAD ERROR:", err);
      document.getElementById("productsGrid").innerHTML =
        "<p>Unable to load products right now. Please try again later.</p>";
    }
  }


  // ======================
  // RENDER ALL PHONE CARDS
  // ======================

  function renderPhones(phones) {
    const grid = document.getElementById("productsGrid");
    grid.innerHTML = "";

    phones.forEach((phone, index) => {
      const storage = phone.storages[0];
      const color = storage.colors[0];

      const card = document.createElement("article");
      card.className = "product-card";
      card.dataset.index = index;

      card.innerHTML = `
        <div class="product-image-wrapper">
          <img src="${color.image}" class="product-image">
        </div>

        <h3>${phone.name}</h3>

        <div class="product-meta">
          <span>${storage.size}</span>
          <span>Brand new • Imported</span>
        </div>

        <div class="product-price">${formatMWK(storage.price_mwk)}</div>

        <label>Storage:
          <select class="storage-select">
            ${phone.storages.map((s,i)=>`<option value="${i}">${s.size}</option>`).join("")}
          </select>
        </label>

        <div class="product-colors">
          ${storage.colors
            .map((c,i)=>`<button class="color-dot ${i===0?"active":""}"><span>${c.name}</span></button>`)
            .join("")}
        </div>

        <div class="product-actions">
          <button class="btn-main wa-btn">WhatsApp</button>
          <a href="product.html?id=${phone.id}" class="btn-outline quick-view-btn">Quick view</a>
          <button class="btn-main add-cart-btn">Add to cart</button>
        </div>
      `;

      grid.appendChild(card);
    });
  }


  // ======================
  // UNIVERSAL CLICK HANDLER (FIXES ALL BUTTON ISSUES)
  // ======================

  document.addEventListener("click", (event) => {
    const target = event.target.closest("button, a");
    if (!target) return;

    const card = target.closest(".product-card");
    if (!card) return;

    const index = Number(card.dataset.index);
    const phone = allPhones[index];
    const storageSelect = card.querySelector(".storage-select");
    const storageObj = phone.storages[Number(storageSelect.value)];

    // COLOR SELECTION
    if (target.classList.contains("color-dot")) {
      card.querySelectorAll(".color-dot").forEach(dot => dot.classList.remove("active"));
      target.classList.add("active");
      return;
    }

    // QUICK VIEW — link works automatically
    if (target.classList.contains("quick-view-btn")) {
      return;
    }

    // ADD TO CART
    if (target.classList.contains("add-cart-btn")) {
      const colorIndex = [...card.querySelectorAll(".color-dot")]
        .findIndex(dot => dot.classList.contains("active"));
      const color = storageObj.colors[colorIndex];
      addToCart(phone, storageObj, color);
      return;
    }

    // WHATSAPP BUTTON
    if (target.classList.contains("wa-btn")) {
      const colorIndex = [...card.querySelectorAll(".color-dot")]
        .findIndex(dot => dot.classList.contains("active"));
      const color = storageObj.colors[colorIndex];
      target.href = buildWhatsAppLink(phone, storageObj, color);
      return;
    }
  });


  // ======================
  // CART SYSTEM
  // ======================

  const cartOverlay = document.getElementById("cartOverlay");
  const cartButton = document.getElementById("cartButton");
  const cartClose = document.getElementById("cartClose");
  const cartItemsDiv = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");
  const cartCount = document.getElementById("cartCount");
  const cartWhatsApp = document.getElementById("cartWhatsApp");
  const clearCart = document.getElementById("clearCart");

  cartButton.onclick = () => cartOverlay.classList.add("visible");
  cartClose.onclick = () => cartOverlay.classList.remove("visible");

  function addToCart(phone, storage, color) {
    cart.push({
      id: `${phone.id}-${storage.size}-${color.name}`.replace(/\s+/g,"-"),
      name: phone.name,
      storage: storage.size,
      color: color.name,
      price: storage.price_mwk
    });
    updateCart();
  }

  function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    updateCart();
  }

  clearCart.onclick = () => { cart = []; updateCart(); };

  function updateCart() {
    cartItemsDiv.innerHTML = "";

    if (!cart.length) {
      cartItemsDiv.innerHTML = "<p>Your cart is empty.</p>";
      cartTotal.textContent = "MWK 0";
      cartCount.textContent = "0";
      cartWhatsApp.href = "#";
      return;
    }

    cart.forEach(item => {
      const div = document.createElement("div");
      div.className = "cart-item";

      div.innerHTML = `
        <div class="cart-item-main">
          <strong>${item.name}</strong>
          <span>${item.storage} • ${item.color}</span>
        </div>
        <div style="text-align:right;">
          <div>${formatMWK(item.price)}</div>
          <button class="cart-item-remove">Remove</button>
        </div>
      `;

      div.querySelector(".cart-item-remove").onclick = () => removeFromCart(item.id);
      cartItemsDiv.appendChild(div);
    });

    cartTotal.textContent = formatMWK(cart.reduce((t,i)=>t+i.price,0));
    cartCount.textContent = cart.length;

    cartWhatsApp.href =
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        cart.map(
          (i,idx) =>
            `${idx+1}. ${i.name} (${i.storage}, ${i.color}) - ${formatMWK(i.price)}`
        ).join("\n")
      )}`;
  }


  // ======================
  // FOOTER YEAR
  // ======================

  document.getElementById("year").textContent = new Date().getFullYear();


  // ======================
  // START
  // ======================

  loadPhones();

}); // END DOMContentLoaded
