// DivinExpress - E-commerce SPA Responsive Logic

const PRODUCTS = window.db.getProducts();

function formatPrice(val) {
  if (val >= 1000) {
    return val.toLocaleString('fr-FR') + " FCFA";
  } else {
    return "$" + val.toFixed(2);
  }
}

// 2. STATE MANAGEMENT
let cart = [];
let activeProduct = PRODUCTS[0];
let activeVariantIndex = 0;
let activeSize = "M";
let currentCategory = ""; // Default to show all products on load
let currentSubcategory = ""; // Default empty subcategory
let searchQuery = "";
let currentSort = "default"; // Sorting state: default, low-high, high-low
let favorites = new Set(); // Product IDs the user has favorited (shared between grid & detail view)

// Desktop load more & filter tracking
let desktopProductLimit = 9;
let lastCategory = "";
let lastSubcategory = "";
let lastSearchQuery = "";
let lastSort = "default";

// Load state from localStorage
try {
  const savedCart = localStorage.getItem("DivinExpress_cart");
  if (savedCart) {
    cart = JSON.parse(savedCart);
  }
  const savedFavs = localStorage.getItem("DivinExpress_favorites");
  if (savedFavs) {
    favorites = new Set(JSON.parse(savedFavs));
  }
} catch (e) {
  console.error("Failed to load from localStorage", e);
}

// DOM Elements
const shopScreen = document.getElementById("shop-screen");
const productListContainer = document.getElementById("product-list-container");

// Cart Elements
const cartBackdrop = document.getElementById("cart-backdrop");
const cartPanel = document.getElementById("cart-panel");
const openCartBtn = document.getElementById("open-cart-btn");
const desktopCartBtn = document.getElementById("desktop-cart-btn");
const closeCartBtn = document.getElementById("close-cart-btn");
const cartItemsContainer = document.getElementById("cart-items-container");
const cartTotalValue = document.getElementById("cart-total-value");
const cartBadgeMobile = document.getElementById("cart-counter-badge");
const cartBadgeDesktop = document.getElementById("desktop-cart-badge");

// Detail Overlay Elements
const detailBackdropOverlay = document.getElementById("detail-backdrop-overlay");
const detailScreen = document.getElementById("detail-screen");
const detailBackBtn = document.getElementById("detail-back-btn");
const desktopCloseDetailBtn = document.getElementById("desktop-close-detail");
const detailCartBtnMobile = document.querySelector(".detail-cart-btn-mobile");
const detailFavBtn = document.querySelector(".detail-fav-btn");

// Search Inputs
const mobileSearchInput = document.getElementById("mobile-search");
const desktopSearchInput = document.getElementById("desktop-search");

// Kids-only custom age input (static element, bound once below to avoid stacking listeners)
const customAgeInput = document.getElementById("custom-child-age");

// 3. RESPONSIVE INITIALIZATION & VIEWPORT setup
function isDesktop() {
  return window.innerWidth > 768;
}

function handleViewportSetup() {
  if (shopScreen) shopScreen.classList.add("active");
  
  if (isDesktop()) {
    if (detailBackdropOverlay && detailBackdropOverlay.classList.contains("active")) {
      detailBackdropOverlay.style.display = "flex";
    }
  } else {
    if (detailBackdropOverlay && detailBackdropOverlay.classList.contains("active")) {
      detailBackdropOverlay.style.display = "block";
    }
  }
  renderProducts();
}

// 4. RENDERING PRODUCTS & FILTERING
function renderProducts() {
  if (!productListContainer) return;
  productListContainer.innerHTML = "";
  
  // Reset limit if filters changed
  if (currentCategory !== lastCategory || 
      currentSubcategory !== lastSubcategory || 
      searchQuery !== lastSearchQuery || 
      currentSort !== lastSort) {
    desktopProductLimit = 9;
    
    // Save last states
    lastCategory = currentCategory;
    lastSubcategory = currentSubcategory;
    lastSearchQuery = searchQuery;
    lastSort = currentSort;
  }
  
  console.log("renderProducts called:", { currentCategory, currentSubcategory, searchQuery, productsLength: PRODUCTS.length });
  
  // Filter products by category & subcategory
  let filtered = PRODUCTS.filter(p => {
    const matchesCategory = !currentCategory
      ? true
      : (currentCategory === "favoris" ? favorites.has(p.id) : p.categories.includes(currentCategory));
      
    if (!matchesCategory) return false;
    
    if (currentSubcategory) {
      return p.subcategory === currentSubcategory;
    }
    return true;
  });

  // Sort by price if requested
  if (currentSort === "low-high") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (currentSort === "high-low") {
    filtered.sort((a, b) => b.price - a.price);
  }

  // Search filter
  if (searchQuery.trim() !== "") {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(p => 
      p.title.toLowerCase().includes(query) || 
      p.desc.toLowerCase().includes(query)
    );
  }

  // Interweave categories ONLY on default catalog load
  if (!currentCategory && !currentSubcategory && !searchQuery && currentSort === "default") {
    const cats = window.db.getCategories();
    const catBuckets = cats.map(c => PRODUCTS.filter(p => p.categories.includes(c.slug)));
    
    let interwoven = [];
    const maxLen = Math.max(...catBuckets.map(b => b.length));
    for (let i = 0; i < maxLen; i++) {
      for (let j = 0; j < catBuckets.length; j++) {
        if (i < catBuckets[j].length) {
          interwoven.push(catBuckets[j][i]);
        }
      }
    }
    filtered = interwoven;
  }

  // Desktop pagination limit logic
  const loadMoreContainer = document.getElementById("load-more-container");
  let displayProducts = filtered;
  if (isDesktop() && filtered.length > desktopProductLimit) {
    if (loadMoreContainer) loadMoreContainer.style.display = "flex";
    displayProducts = filtered.slice(0, desktopProductLimit);
  } else {
    if (loadMoreContainer) loadMoreContainer.style.display = "none";
  }

  if (displayProducts.length === 0) {
    productListContainer.innerHTML = `
      <div class="cart-empty-state" style="grid-column: 1 / -1; padding: 60px 0; text-align: center;">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 48px; height: 48px; margin: 0 auto 16px auto; display: block; stroke: var(--text-secondary);">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="${currentCategory === "favoris" ? "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" : "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"}" />
        </svg>
        <p>${currentCategory === "favoris" ? "Vous n'avez pas encore ajouté de favoris." : "Aucun produit ne correspond à votre recherche ou catégorie."}</p>
      </div>
    `;
    return;
  }

  displayProducts.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    
    let promoBadgeHTML = "";
    if (product.promoCode) {
      promoBadgeHTML = `<span class="badge-tag" style="background-color: var(--accent-red); color: white; left: 16px; top: 46px; font-weight: 700; text-transform: uppercase;">Code: ${product.promoCode}</span>`;
    }
    
    card.innerHTML = `
      <div class="product-image-container">
        <img src="${product.image}" alt="${product.title}">
        <span class="badge-tag">${capitalizeFirst(product.categories[0])}</span>
        ${promoBadgeHTML}
        <button class="fav-btn${favorites.has(product.id) ? ' active' : ''}" data-id="${product.id}">
          <svg fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
        
        <!-- Overlay summary -->
        <div class="product-card-overlay">
          <div class="product-info-texts">
            <h3>${product.title}</h3>
            <div class="product-prices">
              <span class="current-price">${formatPrice(product.price)}</span>
              <span class="old-price">${formatPrice(product.oldPrice)}</span>
            </div>
          </div>
          <button class="add-cart-fast-btn" data-id="${product.id}">
            <svg fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    `;

    // Opens details on card click
    card.addEventListener("click", (e) => {
      if (e.target.closest(".fav-btn") || e.target.closest(".add-cart-fast-btn")) {
        return;
      }
      openProductDetails(product);
    });

    // Directly adds to cart from catalog card
    card.querySelector(".add-cart-fast-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      addToCart(product, product.variants[0], product.sizes[0] || "M");
      
      // Visual feedback: green checkmark
      btn.classList.add("added");
      const originalSvg = btn.innerHTML;
      btn.innerHTML = `
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style="stroke: #ffffff; width: 14px; height: 14px;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
        </svg>
      `;
      setTimeout(() => {
        btn.classList.remove("added");
        btn.innerHTML = originalSvg;
      }, 1500);
    });

    // Favorite toggle button
    card.querySelector(".fav-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      const isActive = !favorites.has(product.id);
      if (isActive) {
        favorites.add(product.id);
      } else {
        favorites.delete(product.id);
      }

      // Save favorites to localStorage
      try {
        localStorage.setItem("DivinExpress_favorites", JSON.stringify(Array.from(favorites)));
      } catch (err) {
        console.error(err);
      }

      // In the "Favoris" view, unfavoriting should drop the card from the list immediately
      if (currentCategory === "favoris" && !isActive) {
        renderProducts();
      } else {
        btn.classList.toggle("active", isActive);
      }

      // Keep the detail view's heart icon in sync if this same product is open there
      if (detailFavBtn && activeProduct && activeProduct.id === product.id) {
        detailFavBtn.classList.toggle("active", isActive);
      }

      showToast(isActive ? "Ajouté aux favoris !" : "Retiré des favoris");
    });

    productListContainer.appendChild(card);
  });
}

// Dynamic Categories and Subcategories Rendering System
function renderCategoryTabs() {
  const container = document.getElementById("dynamic-category-tabs");
  if (!container) return;
  
  const categories = window.db.getCategories();
  container.innerHTML = "";
  
  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "category-tab";
    if (currentCategory === cat.slug) {
      btn.classList.add("active");
    }
    btn.setAttribute("data-category", cat.slug);
    btn.style.outline = "none";
    
    btn.innerHTML = `
      <div class="category-circle-img">
        <img src="${cat.image_url}" alt="${cat.name}">
      </div>
      <span>${cat.name}</span>
    `;
    
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const category = cat.slug;
      
      currentSubcategory = "";
      searchQuery = "";
      const mSearchInput = document.getElementById("mobile-search");
      if (mSearchInput) mSearchInput.value = "";
      const dSearchInput = document.getElementById("desktop-search");
      if (dSearchInput) dSearchInput.value = "";
      
      // Update active tabs
      document.querySelectorAll(".category-tab").forEach(t => {
        t.classList.toggle("active", t.getAttribute("data-category") === category);
      });
      
      // Sync desktop header links
      document.querySelectorAll(".desktop-nav .nav-link").forEach(link => {
        link.classList.toggle("active", link.getAttribute("data-category") === category);
      });
      
      currentCategory = category;
      setActiveBottomNavItem("nav-home-btn");
      renderProducts();
      
      if (isDesktop()) {
        const catSec = document.getElementById("catalog-section");
        if (catSec) catSec.scrollIntoView({ behavior: "smooth" });
      }
    });
    
    container.appendChild(btn);
  });
}

function renderDrawerAccordion() {
  const container = document.getElementById("dynamic-drawer-accordion");
  if (!container) return;
  
  const categories = window.db.getCategories();
  const subcategories = window.db.getSubcategories();
  container.innerHTML = "";
  
  categories.forEach(cat => {
    const catSubs = subcategories.filter(s => s.category_slug === cat.slug);
    
    const item = document.createElement("div");
    item.className = "accordion-item";
    item.style.borderBottom = "1.5px solid var(--accent-light)";
    item.style.paddingBottom = "6px";
    
    // Header button
    const header = document.createElement("button");
    header.className = "accordion-header";
    header.style.cssText = "display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 10px 0; background: transparent; border: none; font-weight: 700; font-family: var(--font-inter); font-size: 0.95rem; color: var(--text-primary); cursor: pointer; text-align: left;";
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <img src="${cat.image_url}" alt="${cat.name}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
        <span>${cat.name}</span>
      </div>
      <svg class="chevron-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 14px; height: 14px; transition: transform 0.25s ease; color: var(--text-secondary);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" /></svg>
    `;
    
    // Accordion Content (links)
    const content = document.createElement("div");
    content.className = "accordion-content";
    content.style.cssText = "display: none; flex-direction: column; padding-left: 44px; gap: 10px; margin-top: 4px; margin-bottom: 8px;";
    
    // "Tous les articles" Link
    const allLink = document.createElement("a");
    allLink.href = "#";
    allLink.className = "nav-drawer-link sub-link";
    allLink.setAttribute("data-category", cat.slug);
    allLink.setAttribute("data-sub", "");
    allLink.style.cssText = "font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); text-decoration: none; padding: 4px 0; display: block;";
    allLink.textContent = "Tous les articles";
    content.appendChild(allLink);
    
    // Subcategories Links
    catSubs.forEach(sub => {
      const link = document.createElement("a");
      link.href = "#";
      link.className = "nav-drawer-link sub-link";
      link.setAttribute("data-category", cat.slug);
      link.setAttribute("data-sub", sub.slug);
      link.style.cssText = "font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); text-decoration: none; padding: 4px 0; display: block;";
      link.textContent = sub.name;
      content.appendChild(link);
    });
    
    // Accordion header click toggles display
    header.addEventListener("click", () => {
      const isOpen = content.style.display === "flex";
      // Close other accordion content blocks
      document.querySelectorAll(".drawer-menu-accordion .accordion-content").forEach(c => c.style.display = "none");
      document.querySelectorAll(".drawer-menu-accordion .chevron-icon").forEach(ch => ch.style.transform = "none");
      
      if (!isOpen) {
        content.style.display = "flex";
        const icon = header.querySelector(".chevron-icon");
        if (icon) {
          icon.style.transform = "rotate(180deg)";
        }
      }
    });
    
    item.appendChild(header);
    item.appendChild(content);
    container.appendChild(item);
  });
  
  bindSubLinkClickHandlers();
}

function bindSubLinkClickHandlers() {
  document.querySelectorAll(".sub-link").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const category = link.getAttribute("data-category");
      const sub = link.getAttribute("data-sub");
      currentCategory = category;
      currentSubcategory = sub;
      searchQuery = "";
      const mSearchInput = document.getElementById("mobile-search");
      if (mSearchInput) mSearchInput.value = "";
      const dSearchInput = document.getElementById("desktop-search");
      if (dSearchInput) dSearchInput.value = "";
      
      document.querySelectorAll(".sub-link").forEach(l => l.classList.remove("active"));
      link.classList.add("active");
      
      // Sync homepage category tabs
      document.querySelectorAll(".category-tab").forEach(t => {
        t.classList.toggle("active", t.getAttribute("data-category") === category);
      });
      
      // Sync desktop nav links
      document.querySelectorAll(".desktop-nav .nav-link").forEach(l => {
        l.classList.toggle("active", l.getAttribute("data-category") === category);
      });
      
      toggleNavDrawer(false);
      setActiveBottomNavItem("nav-home-btn");
      renderProducts();
      
      const catSec = document.getElementById("catalog-section");
      if (catSec) catSec.scrollIntoView({ behavior: "smooth" });
    });
  });
}


// Sync desktop header links
document.querySelectorAll(".desktop-nav .nav-link").forEach(link => {
  link.addEventListener("click", (e) => {
    const category = e.target.getAttribute("data-category");
    if (!category) return;
    
    e.preventDefault();
    
    document.querySelectorAll(".desktop-nav .nav-link").forEach(l => l.classList.remove("active"));
    link.classList.add("active");

    document.querySelectorAll(".category-tab").forEach(t => {
      t.classList.toggle("active", t.getAttribute("data-category") === category);
    });

    currentCategory = category;
    setActiveBottomNavItem("nav-home-btn");
    renderProducts();

    const catSec = document.getElementById("catalog-section");
    if (catSec) catSec.scrollIntoView({ behavior: "smooth" });
  });
});

// Search syncing
if (mobileSearchInput) {
  mobileSearchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    if (desktopSearchInput) desktopSearchInput.value = searchQuery;
    renderProducts();
  });
}

if (desktopSearchInput) {
  desktopSearchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    if (mobileSearchInput) mobileSearchInput.value = searchQuery;
    renderProducts();
  });
}

// Footer links filter category bindings
document.querySelectorAll(".category-filter-link").forEach(link => {
  link.addEventListener("click", (e) => {
    const category = e.target.getAttribute("data-category");
    if (category) {
      currentCategory = category;
      setActiveBottomNavItem("nav-home-btn");
      // Sync tabs
      document.querySelectorAll(".category-tab").forEach(t => {
        t.classList.toggle("active", t.getAttribute("data-category") === category);
      });
      document.querySelectorAll(".desktop-nav .nav-link").forEach(l => {
        l.classList.toggle("active", l.getAttribute("data-category") === category);
      });
      renderProducts();
    }
  });
});

// Helper capitalize
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// 5. PRODUCT DETAILS INTERACTION
function openProductDetails(product) {
  activeProduct = product;
  activeVariantIndex = 0;
  activeSize = product.sizes[1] || product.sizes[0] || "M";

  // Specs bindings
  document.getElementById("detail-title").textContent = product.title;
  document.getElementById("detail-category").textContent = capitalizeFirst(product.categories[0]);
  document.getElementById("detail-current-price").textContent = formatPrice(product.price);
  document.getElementById("detail-old-price").textContent = formatPrice(product.oldPrice);
  document.getElementById("detail-desc").textContent = product.desc;
  
  // Render promo code badge if associated
  const promoContainer = document.getElementById("detail-promo-badge-container");
  if (promoContainer) {
    if (product.promoCode) {
      promoContainer.innerHTML = `
        <span class="badge-tag" style="background-color: var(--accent-red); color: white; border-radius: 4px; padding: 2px 8px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase;">
          Code: ${product.promoCode}
        </span>
      `;
    } else {
      promoContainer.innerHTML = "";
    }
  }
  
  // Set Main gallery image
  document.getElementById("detail-main-img").src = product.image;

  // Sync the detail view's own heart icon with this product's favorited state
  if (detailFavBtn) detailFavBtn.classList.toggle("active", favorites.has(product.id));

  // Custom child age option display
  const sizeTitle = document.getElementById("detail-size-title");
  const customAgeGroup = document.getElementById("custom-age-group");

  if (product.categories.includes("enfant")) {
    if (sizeTitle) sizeTitle.textContent = "Âge de l'enfant";
    if (customAgeGroup) customAgeGroup.style.display = "block";
    if (customAgeInput) customAgeInput.value = "";
  } else {
    if (sizeTitle) sizeTitle.textContent = "Taille";
    if (customAgeGroup) customAgeGroup.style.display = "none";
  }

  // Render variant thumbnails circles
  const thumbsContainer = document.getElementById("detail-thumbnails-container");
  thumbsContainer.innerHTML = "";
  product.variants.forEach((v, index) => {
    const th = document.createElement("div");
    th.className = `variant-thumb ${index === 0 ? 'active' : ''}`;
    th.innerHTML = `<img src="${v.img}" alt="${v.name}">`;
    th.addEventListener("click", () => selectVariant(index));
    thumbsContainer.appendChild(th);
  });

  // Render size selectors
  const sizesContainer = document.getElementById("detail-sizes-container");
  sizesContainer.innerHTML = "";
  product.sizes.forEach(sz => {
    const btn = document.createElement("button");
    btn.className = `size-pill ${sz === activeSize ? 'active' : ''}`;
    btn.textContent = sz;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".size-pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeSize = sz;
      if (customAgeInput) {
        customAgeInput.value = ""; // Clear custom input if pill is clicked
      }
    });
    sizesContainer.appendChild(btn);
  });

  // Render color indicators
  const colorsContainer = document.getElementById("detail-colors-container");
  colorsContainer.innerHTML = "";
  product.variants.forEach((v, index) => {
    const dot = document.createElement("span");
    dot.className = `color-dot ${index === 0 ? 'active' : ''}`;
    dot.style.backgroundColor = v.color;
    dot.addEventListener("click", () => selectVariant(index));
    colorsContainer.appendChild(dot);
  });

  // Toggle detail backdrop overlay
  detailBackdropOverlay.classList.add("active");
  detailBackdropOverlay.style.display = isDesktop() ? "flex" : "block";
}

function selectVariant(index) {
  activeVariantIndex = index;
  const variant = activeProduct.variants[index];
  
  // Swap main image
  document.getElementById("detail-main-img").src = variant.img;
  
  // Swap thumbs active border
  document.querySelectorAll(".variant-thumb").forEach((th, idx) => {
    th.classList.toggle("active", idx === index);
  });

  // Swap color dots active border
  document.querySelectorAll(".color-dot").forEach((dot, idx) => {
    dot.classList.toggle("active", idx === index);
  });

  showToast(`Couleur : ${variant.name}`);
}

function closeProductDetails() {
  detailBackdropOverlay.classList.remove("active");
  detailBackdropOverlay.style.display = "none";
}

// Bind back buttons
if (detailBackBtn) detailBackBtn.addEventListener("click", closeProductDetails);
if (desktopCloseDetailBtn) desktopCloseDetailBtn.addEventListener("click", closeProductDetails);

// Close modal when clicking outer backdrop area on PC
detailBackdropOverlay.addEventListener("click", (e) => {
  if (isDesktop() && e.target === detailBackdropOverlay) {
    closeProductDetails();
  }
});

// Custom child age input: bound once here (not inside openProductDetails) so a fresh
// listener isn't stacked on this static element every time a product detail is opened
if (customAgeInput) {
  customAgeInput.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    if (val !== "") {
      document.querySelectorAll(".size-pill").forEach(b => b.classList.remove("active"));
      activeSize = val;
    } else {
      // Reset to default size from active pill
      const activePill = document.querySelector(".size-pill.active");
      if (activePill) {
        activeSize = activePill.textContent;
      } else {
        const firstPill = document.querySelector(".size-pill");
        if (firstPill) {
          firstPill.classList.add("active");
          activeSize = firstPill.textContent;
        }
      }
    }
  });
}

// Product detail favorite toggle (mobile header heart icon)
if (detailFavBtn) {
  detailFavBtn.addEventListener("click", () => {
    const isActive = !favorites.has(activeProduct.id);
    if (isActive) {
      favorites.add(activeProduct.id);
    } else {
      favorites.delete(activeProduct.id);
    }
    detailFavBtn.classList.toggle("active", isActive);

    // Save favorites to localStorage
    try {
      localStorage.setItem("DivinExpress_favorites", JSON.stringify(Array.from(favorites)));
    } catch (err) {
      console.error(err);
    }

    // Keep the matching catalog card heart in sync if it's currently rendered
    const gridFavBtn = document.querySelector(`.fav-btn[data-id="${activeProduct.id}"]`);
    if (gridFavBtn) gridFavBtn.classList.toggle("active", isActive);

    showToast(isActive ? "Ajouté aux favoris !" : "Retiré des favoris");
  });
}

// 6. CART DRAWER OPERATIONS
function toggleCartDrawer(open) {
  if (open) {
    cartBackdrop.classList.add("active");
    cartPanel.classList.add("active");
    renderCart();
  } else {
    cartBackdrop.classList.remove("active");
    cartPanel.classList.remove("active");
  }
}

// Bind cart toggles
if (openCartBtn) openCartBtn.addEventListener("click", () => toggleCartDrawer(true));
if (desktopCartBtn) desktopCartBtn.addEventListener("click", () => toggleCartDrawer(true));
if (closeCartBtn) closeCartBtn.addEventListener("click", () => toggleCartDrawer(false));
if (cartBackdrop) cartBackdrop.addEventListener("click", () => toggleCartDrawer(false));

if (detailCartBtnMobile) {
  detailCartBtnMobile.addEventListener("click", () => {
    closeProductDetails();
    toggleCartDrawer(true);
  });
}

function addToCart(product, variant, size) {
  const existing = cart.find(item => 
    item.id === product.id && 
    item.variant.color === variant.color && 
    item.size === size
  );

  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      variant: variant,
      size: size,
      qty: 1
    });
  }

  updateCartBadges();
  renderCart();
  
  // Open cart drawer automatically on add
  toggleCartDrawer(true);
  
  // Bounce the cart buttons in header
  const cartBtns = [document.getElementById("desktop-cart-btn"), document.getElementById("open-cart-btn")];
  cartBtns.forEach(btn => {
    if (btn) {
      btn.classList.remove("cart-btn-bounce");
      void btn.offsetWidth; // force reflow
      btn.classList.add("cart-btn-bounce");
    }
  });

  showToast(`${product.title} (${size}) ajouté au panier !`);
}

function updateCartBadges() {
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  
  const mobileCartBadgeDot = document.getElementById("mobile-cart-badge-dot");
  if (mobileCartBadgeDot) {
    mobileCartBadgeDot.textContent = totalQty;
    mobileCartBadgeDot.style.display = totalQty > 0 ? "flex" : "none";
  }

  if (cartBadgeMobile) {
    cartBadgeMobile.textContent = totalQty;
    cartBadgeMobile.style.display = totalQty > 0 ? "flex" : "none";
  }

  if (cartBadgeDesktop) {
    cartBadgeDesktop.textContent = totalQty;
    cartBadgeDesktop.style.display = totalQty > 0 ? "flex" : "none";
  }

  // Save to localStorage
  try {
    localStorage.setItem("DivinExpress_cart", JSON.stringify(cart));
  } catch (e) {
    console.error(e);
  }

  // Animate badges
  const badges = [mobileCartBadgeDot, cartBadgeMobile, cartBadgeDesktop];
  badges.forEach(badge => {
    if (badge && totalQty > 0) {
      badge.classList.remove("cart-badge-bounce");
      void badge.offsetWidth; // force reflow
      badge.classList.add("cart-badge-bounce");
    }
  });
}

function renderCart() {
  if (!cartItemsContainer) return;
  cartItemsContainer.innerHTML = "";

  const clearCartBtn = document.getElementById("clear-cart-btn");
  if (clearCartBtn) {
    clearCartBtn.style.display = cart.length > 0 ? "inline-block" : "none";
  }

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="cart-empty-state">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <p>Votre panier est vide</p>
      </div>
    `;
    cartTotalValue.textContent = "$0.00";
    return;
  }

  let total = 0;

  cart.forEach((item, index) => {
    const itemEl = document.createElement("div");
    itemEl.className = "cart-item";
    
    const subtotal = item.price * item.qty;
    total += subtotal;

    itemEl.innerHTML = `
      <div class="cart-item-image">
        <img src="${item.variant.img}" alt="${item.title}">
      </div>
      <div class="cart-item-details">
        <div>
          <h4 class="cart-item-name">${item.title}</h4>
          <p class="cart-item-meta">Taille: ${item.size} | ${item.variant.name}</p>
        </div>
        <div class="cart-item-price">${formatPrice(item.price)}</div>
      </div>
      <div class="cart-item-actions">
        <button class="cart-item-remove" data-index="${index}">
          <svg fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        <div class="quantity-control">
          <button class="quantity-btn dec" data-index="${index}">-</button>
          <span class="quantity-value">${item.qty}</span>
          <button class="quantity-btn inc" data-index="${index}">+</button>
        </div>
      </div>
    `;

    cartItemsContainer.appendChild(itemEl);
  });

  cartTotalValue.textContent = formatPrice(total);

  // Bind Adjust Quantity Buttons
  document.querySelectorAll(".quantity-btn.dec").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.target.getAttribute("data-index"));
      if (cart[idx].qty > 1) {
        cart[idx].qty--;
      } else {
        cart.splice(idx, 1);
      }
      updateCartBadges();
      renderCart();
    });
  });

  document.querySelectorAll(".quantity-btn.inc").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.target.getAttribute("data-index"));
      cart[idx].qty++;
      updateCartBadges();
      renderCart();
    });
  });

  document.querySelectorAll(".cart-item-remove").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.currentTarget.getAttribute("data-index"));
      cart.splice(idx, 1);
      updateCartBadges();
      renderCart();
      showToast("Article supprimé");
    });
  });
}

// Bind detail specs actions
document.getElementById("detail-add-cart-action").addEventListener("click", () => {
  addToCart(activeProduct, activeProduct.variants[activeVariantIndex], activeSize);
});

document.getElementById("detail-buy-now-action").addEventListener("click", () => {
  addToCart(activeProduct, activeProduct.variants[activeVariantIndex], activeSize);
  closeProductDetails();
  goToCheckout();
});

// 7. TOAST NOTIFICATION UTILITY
let toastTimeout = null;
function showToast(message) {
  const toast = document.getElementById("toast-notification");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// 9. PACKAGE TRACKING DRAWER OPERATIONS
const trackingTabBtn = document.getElementById("tracking-tab-btn");
const trackingBackdrop = document.getElementById("tracking-backdrop");
const trackingPanel = document.getElementById("tracking-panel");
const closeTrackingBtn = document.getElementById("close-tracking-btn");
const trackingSubmitBtn = document.getElementById("tracking-submit-btn");
const trackingInput = document.getElementById("tracking-input");
const trackingStepsContainer = document.getElementById("tracking-steps-container");

function toggleTrackingDrawer(open) {
  if (open) {
    if (trackingBackdrop) trackingBackdrop.classList.add("active");
    if (trackingPanel) trackingPanel.classList.add("active");
    if (trackingInput) trackingInput.value = "";
    if (trackingStepsContainer) trackingStepsContainer.style.display = "none";
  } else {
    if (trackingBackdrop) trackingBackdrop.classList.remove("active");
    if (trackingPanel) trackingPanel.classList.remove("active");
  }
}

if (trackingTabBtn) trackingTabBtn.addEventListener("click", () => toggleTrackingDrawer(true));
if (closeTrackingBtn) closeTrackingBtn.addEventListener("click", () => toggleTrackingDrawer(false));
if (trackingBackdrop) trackingBackdrop.addEventListener("click", () => toggleTrackingDrawer(false));

if (trackingSubmitBtn && trackingInput && trackingStepsContainer) {
  trackingSubmitBtn.addEventListener("click", () => {
    const val = trackingInput.value.trim();
    if (val === "") {
      showToast("Veuillez entrer un numéro de commande.");
      return;
    }
    showToast("Recherche de votre colis DivinExpress...");
    setTimeout(() => {
      trackingStepsContainer.style.display = "flex";
      showToast("Statut de votre commande récupéré !");
    }, 850);
  });
}

let promoDiscount = 0; // Global discount amount

function generateOrderNumber() {
  return "SH-" + Math.floor(10000 + Math.random() * 90000);
}

function showOrderConfirmation() {
  const orderNumber = generateOrderNumber();
  const orderNumberEl = document.getElementById("checkout-order-number");
  if (orderNumberEl) orderNumberEl.textContent = orderNumber;
  
  // Read shipping details
  const fullnameInput = document.getElementById("shipping-fullname");
  const emailInput = document.getElementById("shipping-email");
  const addressInput = document.getElementById("shipping-address");
  const prefixSelect = document.getElementById("phone-country-prefix");
  const phoneInput = document.getElementById("shipping-phone");
  
  const fullname = fullnameInput ? fullnameInput.value : "Client Démo";
  const email = emailInput ? emailInput.value : "";
  const address = addressInput ? addressInput.value : "";
  const phone = (prefixSelect ? prefixSelect.value : "") + " " + (phoneInput ? phoneInput.value : "");
  
  // Calculate total price
  let subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  let shippingCost = 0;
  if (document.getElementById("ship-method-express") && document.getElementById("ship-method-express").checked) {
    shippingCost = (subtotal >= 1000) ? 5400 : 9.00;
  }
  const estimatedTax = (subtotal >= 1000) ? 3000 : 5.00;
  let activePromoDiscount = promoDiscount;
  if (subtotal >= 1000 && promoDiscount > 0 && promoDiscount < 1000) {
    activePromoDiscount = promoDiscount * 600;
  }
  const total = subtotal + shippingCost + estimatedTax - activePromoDiscount;
  
  // Get active payment method
  const activeMethodBtn = document.querySelector(".payment-method-card.active");
  const method = activeMethodBtn ? activeMethodBtn.textContent.trim() : "Mobile Money";

  // Create order object
  const order = {
    id: orderNumber,
    date: new Date().toLocaleDateString('fr-FR'),
    client: fullname,
    email: email,
    address: address,
    phone: phone.trim() || "N/A",
    total: total,
    method: method,
    status: "En attente",
    items: [...cart]
  };

  // Save to DB
  if (window.db) {
    window.db.saveOrder(order);
  }

  setCheckoutStep(3);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setCheckoutStep(stepNumber) {
  for (let i = 1; i <= 3; i++) {
    const node = document.getElementById(`step-node-${i}`);
    if (!node) continue;
    node.classList.remove("active", "completed");
    if (i < stepNumber) node.classList.add("completed");
    else if (i === stepNumber) node.classList.add("active");
  }
  document.querySelectorAll(".step-connector").forEach((connector, idx) => {
    connector.classList.toggle("completed", idx < stepNumber - 1);
  });

  const step1Content = document.getElementById("checkout-step-1-content");
  const step2Content = document.getElementById("checkout-step-2-content");
  const step3Content = document.getElementById("checkout-step-3-content");
  if (step1Content) step1Content.style.display = stepNumber === 1 ? "block" : "none";
  if (step2Content) step2Content.style.display = stepNumber === 2 ? "block" : "none";
  if (step3Content) step3Content.style.display = stepNumber === 3 ? "block" : "none";
}

// Hash Routing for SPA screens
function handleRouting() {
  const hash = window.location.hash || '#boutique';
  const shopScreen = document.getElementById("shop-screen");
  const desktopHero = document.getElementById("desktop-hero");
  const checkoutScreen = document.getElementById("checkout-screen");
  
  if (hash === '#checkout') {
    if (cart.length === 0) {
      window.location.hash = "boutique";
      return;
    }
    if (shopScreen) shopScreen.style.display = "none";
    if (desktopHero) desktopHero.style.display = "none";
    if (checkoutScreen) checkoutScreen.style.display = "block";
    
    setCheckoutStep(1);
    updateEstimatedDeliveryDate();
    renderCheckoutSummary();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    // Default to boutique/shop
    if (shopScreen) shopScreen.style.display = "block";
    if (desktopHero) desktopHero.style.display = isDesktop() ? "block" : "none";
    if (checkoutScreen) checkoutScreen.style.display = "none";
    
    // Reset stepper state when leaving checkout
    setCheckoutStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// Bind routing listeners
window.addEventListener("hashchange", handleRouting);
window.addEventListener("load", handleRouting);

// Shared navigation used by both the cart drawer's checkout button and the
// product detail "Buy now" button, so both paths land on the same checkout state.
function goToCheckout() {
  if (cart.length === 0) {
    showToast("Votre panier est vide.");
    return;
  }
  toggleCartDrawer(false);
  window.location.hash = "checkout";
}

document.getElementById("checkout-action-btn").addEventListener("click", goToCheckout);

// Function to calculate estimated delivery date
function updateEstimatedDeliveryDate() {
  const dateEl = document.getElementById("estimated-delivery-date");
  if (!dateEl) return;
  
  const expressChecked = document.getElementById("ship-method-express") && document.getElementById("ship-method-express").checked;
  const today = new Date();
  
  if (expressChecked) {
    // 1-3 days
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 1);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 3);
    
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    dateEl.textContent = `Livraison : ${minDate.toLocaleDateString('fr-FR', options)} - ${maxDate.toLocaleDateString('fr-FR', options)}`;
  } else {
    // 7-20 days
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 7);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 15);
    
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    dateEl.textContent = `Livraison : ${minDate.toLocaleDateString('fr-FR', options)} - ${maxDate.toLocaleDateString('fr-FR', options)}`;
  }
}

// Back Button from Checkout
const checkoutBackBtn = document.getElementById("checkout-back-btn");
if (checkoutBackBtn) {
  checkoutBackBtn.addEventListener("click", () => {
    window.location.hash = "boutique";
    handleRouting();
  });
}

const checkoutContinueShoppingBtn = document.getElementById("checkout-continue-shopping-btn");
if (checkoutContinueShoppingBtn) {
  checkoutContinueShoppingBtn.addEventListener("click", () => {
    window.location.hash = "boutique";
    handleRouting();
  });
}


// Shipping method change handlers
const shipMethodFree = document.getElementById("ship-method-free");
const shipMethodExpress = document.getElementById("ship-method-express");
const shipFreeLabel = document.getElementById("ship-free-label");
const shipExpressLabel = document.getElementById("ship-express-label");

function updateShippingMethodSelection() {
  const isExpress = shipMethodExpress && shipMethodExpress.checked;
  if (shipFreeLabel) shipFreeLabel.classList.toggle("active", !isExpress);
  if (shipExpressLabel) shipExpressLabel.classList.toggle("active", isExpress);
  
  updateEstimatedDeliveryDate();
  renderCheckoutSummary();
}

if (shipMethodFree) shipMethodFree.addEventListener("change", updateShippingMethodSelection);
if (shipMethodExpress) shipMethodExpress.addEventListener("change", updateShippingMethodSelection);

// Promo code application
const promoCodeApplyBtn = document.getElementById("promo-code-apply-btn");
const promoCodeInput = document.getElementById("promo-code-input");
if (promoCodeApplyBtn && promoCodeInput) {
  promoCodeApplyBtn.addEventListener("click", () => {
    const codeStr = promoCodeInput.value.trim().toUpperCase();
    if (codeStr === "") {
      showToast("Veuillez saisir un code promo.");
      return;
    }
    
    const promos = window.db ? window.db.getPromoCodes() : [];
    const promo = promos.find(p => p.code.toUpperCase() === codeStr && p.active);
    
    if (promo) {
      const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
      if (promo.type === "percent") {
        promoDiscount = subtotal * (parseFloat(promo.value) / 100);
        showToast(`Code promo ${promo.code} appliqué ! (-${promo.value}%)`);
      } else {
        promoDiscount = parseFloat(promo.value);
        showToast(`Code promo ${promo.code} appliqué ! (-${formatPrice(promoDiscount)})`);
      }
      renderCheckoutSummary();
    } else {
      showToast("Code promo invalide ou expiré.");
    }
  });
}

function isEuropeanAddress(address) {
  const normalized = address.toLowerCase();
  
  // List of European countries / terms in French and English
  const europeanKeywords = [
    "france", "belgique", "belgium", "belgie", "suisse", "switzerland", "schweiz", 
    "luxembourg", "allemagne", "germany", "deutschland", "espagne", "spain", "espana", 
    "italie", "italy", "italia", "portugal", "royaume-uni", "united kingdom", "uk", 
    "pays-bas", "netherlands", "nederland", "irlande", "ireland", "autriche", "austria", 
    "suede", "sweden", "norvege", "norway", "danemark", "denmark", "finlande", "finland",
    "grece", "greece", "pologne", "poland", "europe"
  ];
  
  const hasEuroCountry = europeanKeywords.some(keyword => normalized.includes(keyword));
  const postalCodeRegex = /\b\d{4,5}\b/i;
  const ukPostalCodeRegex = /\b[a-z]{1,2}\d[a-z\d]?\s*\d[a-z]{2}\b/i;
  const hasPostalCode = postalCodeRegex.test(normalized) || ukPostalCodeRegex.test(normalized);
  
  return hasEuroCountry && hasPostalCode;
}

// --- Interactive 2-Step Checkout Event Handlers ---
const checkoutToPaymentBtn = document.getElementById("checkout-to-payment-btn");
const checkoutBackToStep1 = document.getElementById("checkout-back-to-step-1");
const checkoutShippingForm = document.getElementById("checkout-shipping-form");

// Clear custom validation message on input
const addressInput = document.getElementById("shipping-address");
if (addressInput) {
  addressInput.addEventListener("input", () => {
    addressInput.setCustomValidity("");
  });
}

if (checkoutToPaymentBtn) {
  checkoutToPaymentBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (checkoutShippingForm && !checkoutShippingForm.checkValidity()) {
      checkoutShippingForm.reportValidity();
      return;
    }
    
    const addressInput = document.getElementById("shipping-address");
    if (addressInput) {
      if (!isEuropeanAddress(addressInput.value)) {
        addressInput.setCustomValidity("Veuillez indiquer une adresse européenne complète (ex: 75002 Paris, France).");
        addressInput.reportValidity();
        return;
      } else {
        addressInput.setCustomValidity("");
      }
    }
    
    // Read values
    const fullname = document.getElementById("shipping-fullname").value;
    const email = document.getElementById("shipping-email").value;
    const address = document.getElementById("shipping-address").value;
    
    const fullnameEl = document.getElementById("recap-fullname");
    const emailEl = document.getElementById("recap-email");
    const addressTextEl = document.getElementById("recap-address-text");
    
    if (fullnameEl) fullnameEl.textContent = fullname;
    if (emailEl) emailEl.textContent = email;
    if (addressTextEl) addressTextEl.textContent = address;
    
    setCheckoutStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

if (checkoutBackToStep1) {
  checkoutBackToStep1.addEventListener("click", () => {
    setCheckoutStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// Tab Switching (Mobile Money / Card)
const payTabBtns = document.querySelectorAll(".payment-method-card");
payTabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    payTabBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const type = btn.getAttribute("data-pay-type");
    const panelMomo = document.getElementById("payment-panel-momo");
    const panelCard = document.getElementById("payment-panel-card");

    if (type === "momo") {
      if (panelMomo) panelMomo.style.display = "block";
      if (panelCard) panelCard.style.display = "none";
    } else {
      if (panelMomo) panelMomo.style.display = "none";
      if (panelCard) panelCard.style.display = "block";
    }
  });
});

// Orange, MTN, Wave Operators cards selection
const momoOpCards = document.querySelectorAll(".momo-op-card");
momoOpCards.forEach(card => {
  card.addEventListener("click", () => {
    momoOpCards.forEach(c => {
      c.classList.remove("active");
    });
    card.classList.add("active");
    
    const radio = card.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
  });
});

// Credit Card dynamic input syncing
const cardInputNumber = document.getElementById("card-input-number");
const cardInputName = document.getElementById("card-input-name");
const cardInputExpiry = document.getElementById("card-input-expiry");
const cardInputCvv = document.getElementById("card-input-cvv");
const virtualCard = document.getElementById("virtual-card");

if (cardInputNumber) {
  cardInputNumber.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    let formatted = "";
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += " ";
      formatted += value[i];
    }
    e.target.value = formatted;
    
    const disp = document.getElementById("card-num-display");
    if (disp) disp.textContent = formatted || "•••• •••• •••• ••••";
  });
}

if (cardInputName) {
  cardInputName.addEventListener("input", (e) => {
    const disp = document.getElementById("card-holder-display");
    if (disp) disp.textContent = e.target.value.toUpperCase() || "NOM COMPLET";
  });
}

if (cardInputExpiry) {
  cardInputExpiry.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 2) {
      value = value.substring(0, 2) + "/" + value.substring(2, 4);
    }
    e.target.value = value;
    
    const disp = document.getElementById("card-exp-display");
    if (disp) disp.textContent = value || "MM/AA";
  });
}

if (cardInputCvv) {
  cardInputCvv.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    e.target.value = value;
    
    const disp = document.getElementById("card-cvv-display");
    if (disp) disp.textContent = value || "•••";
  });
  
  cardInputCvv.addEventListener("focus", () => {
    if (virtualCard) virtualCard.style.transform = "rotateY(180deg)";
  });
  
  cardInputCvv.addEventListener("blur", () => {
    if (virtualCard) virtualCard.style.transform = "rotateY(0deg)";
  });
}

// Inline payment processing simulator
function runInlinePaymentProcessing(titleText, detailsText, onComplete) {
  const paymentCard = document.getElementById("payment-card");
  const processingPanel = document.getElementById("payment-processing-panel");
  const simSpinner = document.getElementById("payment-processing-spinner");
  const simSuccess = document.getElementById("payment-processing-success-icon");
  const simTitle = document.getElementById("payment-processing-title");
  const simText = document.getElementById("payment-processing-text");
  const simTimer = document.getElementById("payment-processing-timer");
  
  if (!paymentCard || !processingPanel) {
    onComplete();
    return;
  }
  
  if (simTitle) simTitle.textContent = titleText;
  if (simText) simText.textContent = detailsText;
  if (simSpinner) simSpinner.style.display = "block";
  if (simSuccess) simSuccess.style.display = "none";
  if (simTimer) {
    simTimer.textContent = "5s";
    simTimer.style.display = "inline-block";
  }
  
  paymentCard.style.display = "none";
  processingPanel.style.display = "flex";
  
  let secondsLeft = 5;
  const interval = setInterval(() => {
    secondsLeft--;
    if (simTimer) simTimer.textContent = `${secondsLeft}s`;
    
    if (secondsLeft === 2) {
      if (simSpinner) simSpinner.style.display = "none";
      if (simSuccess) simSuccess.style.display = "flex";
      if (simTitle) simTitle.textContent = "Paiement validé !";
      if (simText) simText.textContent = "Votre transaction a été validée avec succès. Préparation de votre commande...";
      if (simTimer) simTimer.style.display = "none";
    }
    
    if (secondsLeft <= 0) {
      clearInterval(interval);
      processingPanel.style.display = "none";
      paymentCard.style.display = "block"; // Reset state for future
      onComplete();
    }
  }, 1000);
}

// MoMo simulated payment popup
const submitMomoBtn = document.getElementById("checkout-submit-momo-btn");
const momoPhoneInput = document.getElementById("momo-phone-number");

if (submitMomoBtn) {
  submitMomoBtn.addEventListener("click", () => {
    if (momoPhoneInput && momoPhoneInput.value.trim() === "") {
      showToast("Veuillez saisir votre numéro Mobile Money.");
      return;
    }
    
    const operator = document.querySelector('input[name="momo_operator"]:checked').value;
    const phone = momoPhoneInput.value;
    
    runInlinePaymentProcessing(
      "En attente de validation",
      `Veuillez confirmer la transaction sur votre mobile ${operator} (${phone}).`,
      () => {
        // Reset Cart & Form state
        cart = [];
        promoDiscount = 0;
        if (promoCodeInput) promoCodeInput.value = "";
        if (checkoutShippingForm) checkoutShippingForm.reset();
        if (momoPhoneInput) momoPhoneInput.value = "";
        updateCartBadges();
        showOrderConfirmation();
      }
    );
  });
}

// Card payment submission
const submitCardBtn = document.getElementById("checkout-submit-card-btn");
if (submitCardBtn) {
  submitCardBtn.addEventListener("click", () => {
    const cardNum = document.getElementById("card-input-number").value;
    const cardName = document.getElementById("card-input-name").value;
    const cardExpiry = document.getElementById("card-input-expiry").value;
    const cardCvv = document.getElementById("card-input-cvv").value;
    
    if (cardNum.length < 15 || cardName.trim() === "" || cardExpiry.length < 5 || cardCvv.length < 3) {
      showToast("Veuillez remplir correctement tous les champs de votre carte.");
      return;
    }
    
    runInlinePaymentProcessing(
      "Sécurisation de la transaction...",
      "Vérification des détails de la carte bancaire auprès de votre établissement financier...",
      () => {
        // Reset State
        cart = [];
        promoDiscount = 0;
        if (promoCodeInput) promoCodeInput.value = "";
        if (checkoutShippingForm) checkoutShippingForm.reset();
        
        // Reset inputs card
        document.getElementById("card-input-number").value = "";
        document.getElementById("card-input-name").value = "";
        document.getElementById("card-input-expiry").value = "";
        document.getElementById("card-input-cvv").value = "";
        document.getElementById("card-num-display").textContent = "•••• •••• •••• ••••";
        document.getElementById("card-holder-display").textContent = "NOM COMPLET";
        document.getElementById("card-exp-display").textContent = "MM/AA";
        document.getElementById("card-cvv-display").textContent = "•••";
        
        updateCartBadges();
        showOrderConfirmation();
      }
    );
  });
}

// Demo Autofill Trigger
const demoAutofillBtn = document.getElementById("demo-autofill-btn");
if (demoAutofillBtn) {
  demoAutofillBtn.addEventListener("click", () => {
    const addresses = [
      { fullname: "Moussa Diabaté", email: "moussa.dia@gmail.com", address: "45 Avenue Louise, 1050 Bruxelles, Belgique" },
      { fullname: "Fatou N'Diaye", email: "fatou.nd@yahoo.fr", address: "Rue du Stand 60, 1204 Genève, Suisse" },
      { fullname: "Koffi Mensah", email: "koffi.mensah@outlook.com", address: "12 Rue de la Paix, 75002 Paris, France" }
    ];
    const addr = addresses[Math.floor(Math.random() * addresses.length)];
    
    document.getElementById("shipping-fullname").value = addr.fullname;
    document.getElementById("shipping-email").value = addr.email;
    document.getElementById("shipping-address").value = addr.address;
    
    showToast("⚡ Formulaire pré-rempli avec des données de démonstration !");
  });
}

function renderCheckoutSummary() {
  const checkoutItemsList = document.getElementById("checkout-items-list");
  if (!checkoutItemsList) return;
  checkoutItemsList.innerHTML = "";

  let subtotal = 0;
  cart.forEach(item => {
    const itemSubtotal = item.price * item.qty;
    subtotal += itemSubtotal;

    const itemEl = document.createElement("div");
    itemEl.className = "checkout-cart-item";
    itemEl.innerHTML = `
      <div class="checkout-item-thumb-wrapper">
        <img src="${item.variant.img}" class="checkout-item-thumb" alt="${item.title}">
        <span class="checkout-item-qty-badge">${item.qty}</span>
      </div>
      <div class="checkout-item-info">
        <h4 class="checkout-item-title">${item.title}</h4>
        <p class="checkout-item-subtitle">Taille: ${item.size} | ${item.variant.name}</p>
      </div>
      <span class="checkout-item-price">${formatPrice(itemSubtotal)}</span>
    `;
    checkoutItemsList.appendChild(itemEl);
  });

  // Shipping calculation
  let shippingCost = 0;
  if (shipMethodExpress && shipMethodExpress.checked) {
    shippingCost = (subtotal >= 1000) ? 5400 : 9.00;
  }

  // Taxes
  const estimatedTax = (subtotal >= 1000) ? 3000 : 5.00;

  // Adjusted promo discount
  let activePromoDiscount = promoDiscount;
  if (subtotal >= 1000 && promoDiscount > 0 && promoDiscount < 1000) {
    activePromoDiscount = promoDiscount * 600;
  }

  // Total
  const total = subtotal + shippingCost + estimatedTax - activePromoDiscount;

  // Bind UI breakdown
  const subtotalValueEl = document.getElementById("checkout-subtotal-value");
  const shippingValueEl = document.getElementById("checkout-shipping-value");
  const taxValueEl = document.getElementById("checkout-tax-value");
  const totalValueEl = document.getElementById("checkout-total-value");

  if (subtotalValueEl) subtotalValueEl.textContent = formatPrice(subtotal);
  if (shippingValueEl) shippingValueEl.textContent = formatPrice(shippingCost);
  if (taxValueEl) taxValueEl.textContent = formatPrice(estimatedTax);
  
  if (totalValueEl) {
    if (activePromoDiscount > 0) {
      totalValueEl.innerHTML = `<span style="font-size: 0.8rem; text-decoration: line-through; color: var(--text-secondary); margin-right: 6px;">${formatPrice(subtotal + shippingCost + estimatedTax)}</span>${formatPrice(total)}`;
    } else {
      totalValueEl.textContent = formatPrice(total);
    }
  }
}

document.getElementById("desktop-fav-btn").addEventListener("click", () => {
  const count = favorites.size;
  showToast(`Mes Favoris : ${count} article${count !== 1 ? "s" : ""} enregistré${count !== 1 ? "s" : ""}.`);
});

const desktopAboutLink = document.getElementById("desktop-about-link");
if (desktopAboutLink) {
  desktopAboutLink.addEventListener("click", (e) => {
    e.preventDefault();
    showToast("DivinExpress : Une marque née du minimalisme et du raffinement.");
  });
}

// Newsletter subscription
const newsletterSubmit = document.getElementById("newsletter-submit-btn");
const newsletterEmail = document.getElementById("newsletter-email");
if (newsletterSubmit && newsletterEmail) {
  newsletterSubmit.addEventListener("click", () => {
    const val = newsletterEmail.value;
    if (val.trim() === "" || !val.includes("@")) {
      showToast("Veuillez saisir un e-mail valide.");
      return;
    }
    showToast("Merci ! Vous êtes inscrit à la lettre DivinExpress.");
    newsletterEmail.value = "";
  });
}

// 10. MOBILE FILTER DRAWER OPERATIONS
const mobileFilterBtn = document.getElementById("mobile-filter-btn");
const filterBackdrop = document.getElementById("filter-backdrop");
const filterPanel = document.getElementById("filter-panel");
const closeFilterBtn = document.getElementById("close-filter-btn");
const applyFiltersBtn = document.getElementById("apply-filters-btn");
const sortOptions = document.querySelectorAll("#filter-sort-options .size-pill");

// Subcategory definitions per main category
const SUBCATEGORIES = {
  femme: ["écharpe", "bonnet", "bracelet", "pull"],
  homme: ["casquette", "pantalon", "polo", "tee shirt", "bonnet"],
  enfant: ["bonnet", "tee shirt"]
};

let filterSelectedSubcategory = ""; // Local state inside filter panel

function renderFilterSubcategories() {
  const container = document.getElementById("filter-subcategories-container");
  if (!container) return;
  container.innerHTML = "";
  
  // Get active main category sub-items (fallback to femme if currentCategory is favoris)
  const catKey = (currentCategory === "favoris") ? "femme" : currentCategory;
  const list = SUBCATEGORIES[catKey] || [];
  
  // Set default selection based on current global state when drawer opens
  filterSelectedSubcategory = currentSubcategory;
  
  // Add "Tous" (All) pill
  const allPill = document.createElement("button");
  allPill.className = `size-pill${!filterSelectedSubcategory ? " active" : ""}`;
  allPill.textContent = "Tous";
  allPill.style.cssText = "width: auto; height: 38px; border-radius: 19px; padding: 0 16px; border: 1px solid var(--accent-light); background: transparent; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 0.8rem; font-weight: 600;";
  allPill.addEventListener("click", () => {
    filterSelectedSubcategory = "";
    container.querySelectorAll(".size-pill").forEach(p => p.classList.remove("active"));
    allPill.classList.add("active");
  });
  container.appendChild(allPill);
  
  list.forEach(sub => {
    const pill = document.createElement("button");
    pill.className = `size-pill${filterSelectedSubcategory === sub ? " active" : ""}`;
    pill.textContent = capitalizeFirst(sub);
    pill.style.cssText = "width: auto; height: 38px; border-radius: 19px; padding: 0 16px; border: 1px solid var(--accent-light); background: transparent; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 0.8rem; font-weight: 600;";
    pill.addEventListener("click", () => {
      filterSelectedSubcategory = sub;
      container.querySelectorAll(".size-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
    });
    container.appendChild(pill);
  });
}

function toggleFilterDrawer(open) {
  if (open) {
    if (filterBackdrop) filterBackdrop.classList.add("active");
    if (filterPanel) filterPanel.classList.add("active");
    renderFilterSubcategories();
  } else {
    if (filterBackdrop) filterBackdrop.classList.remove("active");
    if (filterPanel) filterPanel.classList.remove("active");
  }
}

if (mobileFilterBtn) mobileFilterBtn.addEventListener("click", () => toggleFilterDrawer(true));
if (closeFilterBtn) closeFilterBtn.addEventListener("click", () => toggleFilterDrawer(false));
if (filterBackdrop) filterBackdrop.addEventListener("click", () => toggleFilterDrawer(false));

// Sort pills toggling
sortOptions.forEach(btn => {
  btn.addEventListener("click", () => {
    sortOptions.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

if (applyFiltersBtn) {
  applyFiltersBtn.addEventListener("click", () => {
    const activeSortPill = document.querySelector("#filter-sort-options .size-pill.active");
    if (activeSortPill) {
      currentSort = activeSortPill.getAttribute("data-sort");
    }
    
    currentSubcategory = filterSelectedSubcategory;
    
    // Sync sub-link active state in left menu drawer
    document.querySelectorAll(".sub-link").forEach(l => {
      const matchesCategory = l.getAttribute("data-category") === currentCategory;
      const matchesSub = l.getAttribute("data-sub") === currentSubcategory;
      l.classList.toggle("active", matchesCategory && matchesSub);
    });
    
    renderProducts();
    toggleFilterDrawer(false);
    showToast("Filtres appliqués.");
  });
}

// 11. MOBILE NAVIGATION DRAWER OPERATIONS
const mobileHamburgerBtn = document.getElementById("mobile-hamburger-btn");
const navDrawer = document.getElementById("nav-drawer");
const navDrawerBackdrop = document.getElementById("nav-drawer-backdrop");
const closeNavDrawerBtn = document.getElementById("close-nav-drawer-btn");
const mobileCartToggleBtn = document.getElementById("mobile-cart-toggle-btn");
const mobileSearchToggleBtn = document.getElementById("mobile-search-toggle-btn");

function toggleNavDrawer(open) {
  if (open) {
    if (navDrawer) navDrawer.classList.add("active");
    if (navDrawerBackdrop) navDrawerBackdrop.classList.add("active");
  } else {
    if (navDrawer) navDrawer.classList.remove("active");
    if (navDrawerBackdrop) navDrawerBackdrop.classList.remove("active");
  }
}

if (mobileHamburgerBtn) {
  mobileHamburgerBtn.addEventListener("click", () => toggleNavDrawer(true));
}
if (closeNavDrawerBtn) {
  closeNavDrawerBtn.addEventListener("click", () => toggleNavDrawer(false));
}
if (navDrawerBackdrop) {
  navDrawerBackdrop.addEventListener("click", () => toggleNavDrawer(false));
}

// Mobile Classic Header actions
if (mobileCartToggleBtn) {
  mobileCartToggleBtn.addEventListener("click", () => toggleCartDrawer(true));
}

if (mobileSearchToggleBtn) {
  mobileSearchToggleBtn.addEventListener("click", () => {
    const searchInput = document.getElementById("mobile-search");
    if (searchInput) {
      searchInput.focus();
      searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
}



const mobileTrackingLink = document.getElementById("mobile-tracking-link");
if (mobileTrackingLink) {
  mobileTrackingLink.addEventListener("click", (e) => {
    e.preventDefault();
    toggleNavDrawer(false);
    toggleTrackingDrawer(true);
  });
}

// 12. FLOATING BOTTOM NAV BAR (mobile)
function setActiveBottomNavItem(id) {
  document.querySelectorAll("#bottom-nav-bar .nav-item").forEach(btn => btn.classList.remove("active"));
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
}

function scrollShopContentToTop() {
  const activeScreenContent = document.querySelector(".screen.active .screen-content");
  if (activeScreenContent) activeScreenContent.scrollTo({ top: 0, behavior: "smooth" });
}

// "Boutique" - leaves favorites view and resets subcategory
const navHomeBtn = document.getElementById("nav-home-btn");
if (navHomeBtn) {
  navHomeBtn.addEventListener("click", () => {
    currentSubcategory = "";
    if (currentCategory === "favoris") {
      currentCategory = "femme";
    }
    // Remove sub-link active highlights
    document.querySelectorAll(".sub-link").forEach(l => l.classList.remove("active"));
    document.querySelectorAll(".category-tab").forEach(t => t.classList.toggle("active", t.getAttribute("data-category") === currentCategory));
    document.querySelectorAll(".desktop-nav .nav-link").forEach(l => l.classList.toggle("active", l.getAttribute("data-category") === currentCategory));
    
    setActiveBottomNavItem("nav-home-btn");
    renderProducts();
    scrollShopContentToTop();
  });
}

// "Favoris" - shows only favorited products
const navFavoritesBtn = document.getElementById("nav-favorites-btn");
if (navFavoritesBtn) {
  navFavoritesBtn.addEventListener("click", () => {
    currentCategory = "favoris";
    currentSubcategory = "";
    document.querySelectorAll(".sub-link").forEach(l => l.classList.remove("active"));
    document.querySelectorAll(".category-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".desktop-nav .nav-link").forEach(l => l.classList.remove("active"));
    setActiveBottomNavItem("nav-favorites-btn");
    renderProducts();
    scrollShopContentToTop();
  });
}

// "Recherche" - opens search overlay
const navSearchBtn = document.getElementById("nav-search-btn");
const searchOverlay = document.getElementById("search-overlay");
const closeSearchOverlayBtn = document.getElementById("close-search-overlay-btn");

function toggleSearchOverlay(open) {
  if (!searchOverlay) return;
  if (open) {
    searchOverlay.style.display = "flex";
    if (mobileSearchInput) {
      setTimeout(() => {
        mobileSearchInput.value = searchQuery;
        mobileSearchInput.focus();
      }, 100);
    }
  } else {
    searchOverlay.style.display = "none";
  }
}

if (navSearchBtn) {
  navSearchBtn.addEventListener("click", () => {
    window.location.hash = "boutique";
    setActiveBottomNavItem("nav-search-btn");
    toggleSearchOverlay(true);
  });
}

if (closeSearchOverlayBtn) {
  closeSearchOverlayBtn.addEventListener("click", () => toggleSearchOverlay(false));
}

if (mobileSearchInput) {
  mobileSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      searchQuery = mobileSearchInput.value;
      toggleSearchOverlay(false);
      renderProducts();
      scrollShopContentToTop();
    }
  });
  mobileSearchInput.addEventListener("input", () => {
    searchQuery = mobileSearchInput.value;
    renderProducts();
  });
}

// "Suivi de colis" (mobile header)
const mobileTrackingToggleBtn = document.getElementById("mobile-tracking-toggle-btn");
if (mobileTrackingToggleBtn) {
  mobileTrackingToggleBtn.addEventListener("click", () => toggleTrackingDrawer(true));
}

// Inline filter button click
const inlineFilterBtn = document.getElementById("inline-filter-btn");
if (inlineFilterBtn) {
  inlineFilterBtn.addEventListener("click", (e) => {
    e.preventDefault();
    toggleFilterDrawer(true);
  });
}

// Clear cart button click listener
const clearCartBtn = document.getElementById("clear-cart-btn");
if (clearCartBtn) {
  clearCartBtn.addEventListener("click", () => {
    cart = [];
    updateCartBadges();
    renderCart();
    showToast("Votre panier a été vidé.");
  });
}

// Window resize updates
window.addEventListener("resize", () => {
  handleViewportSetup();
});

// Countdown Timer for Promo Code
function startPromoCountdown() {
  const timerElement = document.getElementById("promo-timer");
  if (!timerElement) return;

  function updateTimer() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0); // Next midnight
    
    const diff = midnight - now;
    if (diff <= 0) {
      timerElement.textContent = "00:00:00";
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (num) => String(num).padStart(2, '0');
    timerElement.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

// FAQ Accordion Toggle
function setupFaqAccordion() {
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(item => {
    const header = item.querySelector(".faq-question");
    if (header) {
      header.addEventListener("click", () => {
        const isActive = item.classList.contains("active");
        
        // Close all
        faqItems.forEach(i => {
          i.classList.remove("active");
          const ans = i.querySelector(".faq-answer");
          if (ans) ans.style.maxHeight = null;
          const icon = i.querySelector(".faq-icon");
          if (icon) icon.style.transform = "rotate(0deg)";
        });

        if (!isActive) {
          item.classList.add("active");
          const answer = item.querySelector(".faq-answer");
          if (answer) answer.style.maxHeight = answer.scrollHeight + "px";
          const icon = item.querySelector(".faq-icon");
          if (icon) icon.style.transform = "rotate(45deg)";
        }
      });
    }
  });
}

// Initialize on DOM ready
window.addEventListener("DOMContentLoaded", () => {
  renderCategoryTabs();
  renderDrawerAccordion();
  handleViewportSetup();
  updateCartBadges();
  startPromoCountdown();
  setupFaqAccordion();

  // Load more button listener
  const loadMoreBtn = document.getElementById("load-more-btn");
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      desktopProductLimit = 999; // Expand limit to show all
      renderProducts();
    });
  }
});
