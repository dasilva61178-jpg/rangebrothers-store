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

    // --- REPLACED: Updated HTML structure to match Apple/Back Market Polish ---
    quickViewBody.innerHTML = `
      <div class="quick-view-content"> 
          
          <div class="product-image-section">
              <div class="product-image-container">
                  <img id="qv-main-image" src="${defaultColor.image}" alt="${phone.name}" class="apple-product-image">
              </div>
              
              <div class="color-options">
                  <p class="color-label">Color:</p>
                  <div id="qvColors" class="color-swatches">
                      </div>
              </div>
          </div>
          
          <div class="product-details-section">
              
              <h2 class="product-title">${phone.name}</h2>
              <p class="service-tagline">Grade A: Like New Condition, 1-Year Warranty</p>
      
              <div class="price-block">
                  <span id="qvPrice" class="current-price">${formatMWK(defaultStorage.price_mwk)}</span>
                  <span class="original-price">${formatMWK(defaultStorage.price_mwk * 1.5)} new</span> 
              </div>
      
              <hr>
      
              <div class="condition-selector">
                  <p class="condition-label">Condition Grade:</p>
                  <select id="qvConditionSelect" class="select-box">
                      <option value="grade-a">Grade A (Like New) - ${formatMWK(defaultStorage.price_mwk)}</option>
                      <option value="grade-b">Grade B (Excellent) - ${formatMWK(defaultStorage.price_mwk * 0.9)}</option>
                      <option value="grade-c">Grade C (Good) - ${formatMWK(defaultStorage.price_mwk * 0.8)}</option>
                  </select>
              </div>

              <div class="storage-selector">
                  <p class="storage-label">Storage:</p>
                  <select id="qvStorageSelect" class="select-box">
                      ${phone.storages
                        .map(
                          (s, idx) =>
                            `<option value="${idx}">${s.size}${
                              isStorageInStock(s) ? "" : " (Out)"
                            }</option>`
                        )
                        .join("")}
                  </select>
              </div>
      
              <button id="qvAddCart" class="add-to-cart-btn">Add to cart</button>
      
              <div class="trust-icons">
                  <p>✅ 1-Year Warranty</p>
                  <p>🚚 Free 3-Day Shipping</p>
                  <p>♻️ Eco-Friendly Certified</p>
              </div>
          </div>
      
      </div>
    `;

    // --- REPLACED: Updated element selection to match new IDs/Classes ---
    const img = document.getElementById("qv-main-image");
    const storageSelect = document.getElementById("qvStorageSelect");
    const colorsDiv = document.getElementById("qvColors");
    const priceEl = document.getElementById("qvPrice");
    const addBtn = document.getElementById("qvAddCart");

    // We no longer need waBtn in this Quick View as we're focusing on cart/direct order

    function getS() {
      return phone.storages[Number(storageSelect.value)];
    }

    function renderColorsQ(s, activeName = null) {
      colorsDiv.innerHTML = "";

      s.colors.forEach((c, idx) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "swatch"; // Use the new class name for styling
        b.style.backgroundColor = c.hex_code || "gray"; // Assume colors have hex_code for proper swatch styling
        b.dataset.image = c.image; // Store image path directly on the swatch
        b.dataset.name = c.name;
        b.title = c.name;
        
        if ((!activeName && idx === 0) || activeName === c.name)
          b.classList.add("active");

        b.addEventListener("click", () => {
          img.src = b.dataset.image; // Set image from data attribute
          colorsDiv
            .querySelectorAll(".swatch") // Use new class name
            .forEach((x) => x.classList.remove("active"));
          b.classList.add("active");
          // Rebuild WhatsApp link data if needed, but for now we focus on Add to Cart
        });

        colorsDiv.appendChild(b);
      });

      // Set initial image and active swatch
      const selected = s.colors.find((c) => c.name === activeName) || s.colors[0];
      img.src = selected.image;
    }

    renderColorsQ(defaultStorage);

    storageSelect.addEventListener("change", () => {
      const s = getS();
      // NOTE: This assumes price doesn't change with condition select.
      priceEl.textContent = formatMWK(s.price_mwk); 
      renderColorsQ(s);
    });
    
    // Add logic to handle Condition Selector (qvConditionSelect) if price changes
    // const conditionSelect = document.getElementById("qvConditionSelect");
    // conditionSelect.addEventListener('change', () => { ... update price ... });

    addBtn.addEventListener("click", () => {
      const s = getS();
      const active = colorsDiv.querySelector(".swatch.active");
      const colorName = active.dataset.name;
      const c = s.colors.find(col => col.name === colorName);
      
      if (!c) {
          alert("Please select a color.");
          return;
      }

      addToCart(phone, s, c);
      alert(`${phone.name} (${s.size}, ${c.name}) added to cart!`);
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
// CART SYSTEM (rest of the file remains the same)
// =====================
