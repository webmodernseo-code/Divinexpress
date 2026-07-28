// DivinExpress Database Adapter (Local & Supabase ready)

const DEFAULT_CATEGORIES = [
  { slug: "femme", name: "Femme", image_url: "images/category_woman.png" },
  { slug: "homme", name: "Homme", image_url: "images/category_man.png" },
  { slug: "enfant", name: "Enfant", image_url: "images/category_kid.png" },
  { slug: "gadget", name: "Gadget", image_url: "images/category_gadget.png" }
];

const DEFAULT_SUBCATEGORIES = [
  { category_slug: "femme", name: "Casual", slug: "casual" },
  { category_slug: "femme", name: "Robe", slug: "robe" },
  { category_slug: "femme", name: "Pull", slug: "pull" },
  { category_slug: "homme", name: "Casual", slug: "casual" },
  { category_slug: "homme", name: "Pantalon", slug: "pantalon" },
  { category_slug: "homme", name: "Polo", slug: "polo" },
  { category_slug: "enfant", name: "Casual", slug: "casual" },
  { category_slug: "enfant", name: "Pull", slug: "pull" },
  { category_slug: "gadget", name: "Maroquinerie", slug: "maroquinerie" },
  { category_slug: "gadget", name: "Accessoire", slug: "accessoire" }
];

const DEFAULT_ORDERS = [
  { id: "DV-09312", date: "20/07/2026", client: "Aïssatou Diallo", email: "aissatou.d@example.com", address: "Cocody Angré, Abidjan", phone: "+225 07 00 00 00 00", total: 18500, method: "MTN MoMo", status: "Payée", items: [] },
  { id: "SH-09311", date: "19/07/2026", client: "Jean Kouassi", email: "jean.k@example.com", address: "Marcory, Abidjan", phone: "+225 05 00 00 00 00", total: 31200, method: "Orange Money", status: "En attente", items: [] },
  { id: "SH-09310", date: "18/07/2026", client: "Fatou Bamba", email: "fatou.b@example.com", address: "Yopougon, Abidjan", phone: "+225 01 00 00 00 00", total: 8000, method: "Wave", status: "Payée", items: [] },
  { id: "SH-09309", date: "17/07/2026", client: "Marc Dupont", email: "marc.d@example.com", address: "Plateau, Abidjan", phone: "+225 07 11 22 33 44", total: 66000, method: "Carte Bancaire", status: "Annulée", items: [] }
];

const DEFAULT_PRODUCTS = [
  // --- FEMME (6 Items) ---
  {
    id: "pull-torsade-court",
    title: "Pull en Torsades Court",
    categories: ["femme", "casual"],
    subcategory: "pull",
    price: 52.00,
    oldPrice: 62.00,
    desc: "Pull court à col roulé et torsades tricoté dans un mélange de laine ultra-doux. Coupe minimaliste et volume contemporain.",
    image: "images/cable_cream.png",
    variants: [
      { img: "images/cable_cream.png", color: "#f9f6f0", name: "Blanc Crème" },
      { img: "images/cable_pink.png", color: "#d8b2d1", name: "Vieux Rose" }
    ],
    sizes: ["S", "M", "L"],
    stock: 2,
    promoCode: "DIVINE10"
  },
  {
    id: "echarpe-cachemire",
    title: "Écharpe Cachemire Premium",
    categories: ["femme", "casual"],
    subcategory: "écharpe",
    price: 110.00,
    oldPrice: 135.00,
    desc: "Écharpe d'une douceur exceptionnelle en cachemire pur. Design épuré, franges discrètes et format généreux pour les journées d'hiver.",
    image: "images/trench_beige.png",
    variants: [
      { img: "images/trench_beige.png", color: "#d2b48c", name: "Beige Mastic" },
      { img: "images/trench_black.png", color: "#1c1c1c", name: "Noir Onyx" }
    ],
    sizes: ["Taille Unique"],
    stock: 12
  },
  {
    id: "bracelet-laiton",
    title: "Bracelet Laiton Minimaliste",
    categories: ["femme", "casual"],
    subcategory: "bracelet",
    price: 85.00,
    oldPrice: 98.00,
    desc: "Bracelet rigide ajustable fini en laiton poli. Un bijou épuré dessiné avec un profil fin pour souligner le poignet.",
    image: "images/linen_sable.png",
    variants: [
      { img: "images/linen_sable.png", color: "#eedcb2", name: "Or Satin" },
      { img: "images/linen_slate.png", color: "#708090", name: "Argent Poli" }
    ],
    sizes: ["Taille Unique"],
    stock: 8
  },
  {
    id: "bonnet-cote-femme",
    title: "Bonnet en Maille Côtelée",
    categories: ["femme", "casual"],
    subcategory: "bonnet",
    price: 45.00,
    oldPrice: 55.00,
    desc: "Bonnet doux en laine mélangée côtelée à revers. Chaud, respirant et d'une esthétique décontractée pour l'hiver.",
    image: "images/silk_emerald.png",
    variants: [
      { img: "images/silk_emerald.png", color: "#004930", name: "Vert Émeraude" },
      { img: "images/silk_ruby.png", color: "#a22b3e", name: "Rouge Rubis" }
    ],
    sizes: ["Taille Unique"],
    stock: 15
  },
  {
    id: "pull-col-v",
    title: "Pull Col V Cachemire",
    categories: ["femme", "streetwear"],
    subcategory: "pull",
    price: 65.00,
    oldPrice: 78.00,
    desc: "Pull classique col V revisité dans une coupe contemporaine légèrement fluide. Confectionné en cachemire régénéré de haute qualité.",
    image: "images/cargo_kaki.png",
    variants: [
      { img: "images/cargo_kaki.png", color: "#556b2f", name: "Vert Kaki" },
      { img: "images/cargo_soot.png", color: "#252525", name: "Noir Suie" }
    ],
    sizes: ["XS", "S", "M", "L"],
    stock: 9
  },
  {
    id: "pull-maille-torsade",
    title: "Pull Maille Torsadée",
    categories: ["femme", "streetwear"],
    subcategory: "pull",
    price: 55.00,
    oldPrice: 65.00,
    desc: "Pull court à torsades contemporaines. Confortable et structuré, il s'associe idéalement avec nos pantalons taille haute.",
    image: "images/cable_pink.png",
    variants: [
      { img: "images/cable_pink.png", color: "#d8b2d1", name: "Vieux Rose" },
      { img: "images/cable_cream.png", color: "#f9f6f0", name: "Blanc Crème" }
    ],
    sizes: ["S", "M", "L"],
    stock: 22
  },

  // --- HOMME (6 Items) ---
  {
    id: "polo-signature",
    title: "Polo Signature DivinExpress",
    categories: ["homme", "streetwear"],
    subcategory: "polo",
    price: 75.00,
    oldPrice: 90.00,
    desc: "Polo en piqué de coton lourd de quality supérieure. Coupe légèrement décontractée, col structuré et détails minimalistes.",
    image: "images/product_male.png",
    variants: [
      { img: "images/product_male.png", color: "#f5f3ef", name: "Blanc Craie" }
    ],
    sizes: ["M", "L", "XL"],
    stock: 18
  },
  {
    id: "tee-shirt-molletone",
    title: "Tee-Shirt Molletonné",
    categories: ["homme", "streetwear"],
    subcategory: "tee shirt",
    price: 59.00,
    oldPrice: 75.00,
    desc: "Tee-shirt lourd de coupe boxy fabriqué en molleton de coton peigné doux. Confort optimal et tombé impeccable.",
    image: "images/leather_black.png",
    variants: [
      { img: "images/leather_black.png", color: "#1a1a1a", name: "Noir Profond" },
      { img: "images/leather_chocolate.png", color: "#4b2f1d", name: "Chocolat" }
    ],
    sizes: ["S", "M", "L", "XL"],
    stock: 14
  },
  {
    id: "bonnet-merinos-homme",
    title: "Bonnet en Laine Mérinos",
    categories: ["homme", "streetwear"],
    subcategory: "bonnet",
    price: 40.00,
    oldPrice: 50.00,
    desc: "Bonnet minimaliste en laine mérinos extra-fine. Maille souple isolante et respirante pour une protection thermique optimale.",
    image: "images/hoodie_pebble.png",
    variants: [
      { img: "images/hoodie_pebble.png", color: "#e3dfd5", name: "Galet" },
      { img: "images/hoodie_sage.png", color: "#5a6358", name: "Sauge" }
    ],
    sizes: ["Taille Unique"],
    stock: 5
  },
  {
    id: "pantalon-chino-ajuste",
    title: "Pantalon Chino Ajusté",
    categories: ["homme", "casual"],
    subcategory: "pantalon",
    price: 70.00,
    oldPrice: 85.00,
    desc: "Pantalon en gabardine de coton stretch doux. Coupe ajustée contemporaine et poches passepoilées élégantes.",
    image: "images/chino_sand.png",
    variants: [
      { img: "images/chino_sand.png", color: "#c5b398", name: "Sable Doré" },
      { img: "images/chino_navy.png", color: "#192231", name: "Bleu Marine" }
    ],
    sizes: ["30", "32", "34", "36"],
    stock: 24
  },
  {
    id: "casquette-coton",
    title: "Casquette Coton Vintage",
    categories: ["homme", "casual"],
    subcategory: "casquette",
    price: 35.00,
    oldPrice: 45.00,
    desc: "Casquette classique en sergé de coton délavé. Patte d'ajustement métallique arrière et broderie minimaliste DivinExpress.",
    image: "images/denim_raw.png",
    variants: [
      { img: "images/denim_raw.png", color: "#22354c", name: "Bleu Indigo" },
      { img: "images/denim_grey.png", color: "#1c1c1c", name: "Gris Anthracite" }
    ],
    sizes: ["Taille Unique"],
    stock: 19
  },
  {
    id: "pantalon-fluide-homme",
    title: "Pantalon Fluide Homme",
    categories: ["homme", "casual"],
    subcategory: "pantalon",
    price: 80.00,
    oldPrice: 95.00,
    desc: "Pantalon droit de coupe fluide moderne en laine froide mélangée légère. Taille élastiquée dissimulée et tombé parfait.",
    image: "images/blazer_anthracite.png",
    variants: [
      { img: "images/blazer_anthracite.png", color: "#2d2d30", name: "Anthracite" },
      { img: "images/blazer_camel.png", color: "#c19a6b", name: "Camel" }
    ],
    sizes: ["S", "M", "L", "XL"],
    stock: 7
  },

  // --- ENFANT (4 Items) ---
  {
    id: "tee-shirt-coton-enfant",
    title: "Tee-Shirt en Coton Enfant",
    categories: ["enfant", "casual"],
    subcategory: "tee shirt",
    price: 25.00,
    oldPrice: 35.00,
    desc: "Tee-shirt à col rond en jersey de coton biologique doux. Confortable et robuste pour le quotidien des petits.",
    image: "images/teddy_brown.png",
    variants: [
      { img: "images/teddy_brown.png", color: "#8b5a2b", name: "Brun Terre" },
      { img: "images/teddy_celadon.png", color: "#acbaa1", name: "Vert Céladon" }
    ],
    sizes: ["2 ans", "4 ans", "6 ans"],
    stock: 12
  },
  {
    id: "bonnet-tricot-enfant",
    title: "Bonnet Tricot Enfant",
    categories: ["enfant", "casual"],
    subcategory: "bonnet",
    price: 20.00,
    oldPrice: 28.00,
    desc: "Bonnet tricoté doux en coton bio. Confort thermique optimal sans irriter la peau sensible des enfants.",
    image: "images/dungarees_blue.png",
    variants: [
      { img: "images/dungarees_blue.png", color: "#3a6073", name: "Bleu Denim" },
      { img: "images/dungarees_pink.png", color: "#e8a7b5", name: "Rose Pâle" }
    ],
    sizes: ["2 ans", "3 ans", "4 ans", "5 ans"],
    stock: 8
  },
  {
    id: "tee-shirt-rayure-enfant",
    title: "Tee-Shirt Rayures Enfant",
    categories: ["enfant", "casual"],
    subcategory: "tee shirt",
    price: 24.00,
    oldPrice: 32.00,
    desc: "Tee-shirt rayé à col rond en tricot de coton ultra-doux. Design intemporel et matières saines.",
    image: "images/kids_jumper.png",
    variants: [
      { img: "images/kids_jumper.png", color: "#df7356", name: "Rayures Multi" }
    ],
    sizes: ["4 ans", "6 ans", "8 ans"],
    stock: 10
  },
  {
    id: "bonnet-coton-bebe",
    title: "Bonnet Coton Bio Bébé",
    categories: ["enfant", "casual"],
    subcategory: "bonnet",
    price: 18.00,
    oldPrice: 24.00,
    desc: "Petit bonnet tricoté en coton bio très souple avec attache sous le menton pour protéger les nouveaux-nés.",
    image: "images/product_orange.png",
    variants: [
      { img: "images/product_orange.png", color: "#dca738", name: "Moutarde" },
      { img: "images/product_grey.png", color: "#e2dacf", name: "Gris Chiné" }
    ],
    sizes: ["12 mois", "18 mois", "2 ans"],
    stock: 3
  },

  // --- GADGET (3 Items) ---
  {
    id: "portefeuille-cuir",
    title: "Portefeuille Cuir Minimaliste",
    categories: ["gadget", "maroquinerie"],
    subcategory: "maroquinerie",
    price: 18500.00,
    oldPrice: 22000.00,
    desc: "Portefeuille ultra-fin conçu en cuir véritable tanné végétal. Comprend 4 fentes pour cartes et un compartiment à billets central.",
    image: "images/gadget_wallet.png",
    variants: [
      { img: "images/gadget_wallet.png", color: "#4b2f1d", name: "Chocolat", images: ["images/gadget_wallet.png"] },
      { img: "images/leather_black.png", color: "#000000", name: "Noir", images: ["images/leather_black.png"] }
    ],
    sizes: ["Taille Unique"],
    stock: 15
  },
  {
    id: "porte-cles-laiton",
    title: "Porte-Clés Laiton Massif",
    categories: ["gadget", "accessoire"],
    subcategory: "accessoire",
    price: 8000.00,
    oldPrice: 10000.00,
    desc: "Porte-clés robuste en laiton massif avec mousqueton et anneau fendu sécurisé. Une pièce intemporelle faite pour durer.",
    image: "images/gadget_keychain.png",
    variants: [
      { img: "images/gadget_keychain.png", color: "#eedcb2", name: "Or Laiton", images: ["images/gadget_keychain.png"] }
    ],
    sizes: ["Taille Unique"],
    stock: 30
  },
  {
    id: "etui-cartes-premium",
    title: "Étui Cartes Premium",
    categories: ["gadget", "maroquinerie"],
    subcategory: "maroquinerie",
    price: 12000.00,
    oldPrice: 15000.00,
    desc: "Étui à cartes élégant en cuir pleine fleur. Design compact pour se glisser dans toutes les poches.",
    image: "images/gadget_cardholder.png",
    variants: [
      { img: "images/gadget_cardholder.png", color: "#c19a6b", name: "Cognac", images: ["images/gadget_cardholder.png"] },
      { img: "images/leather_black.png", color: "#000000", name: "Noir", images: ["images/leather_black.png"] }
    ],
    sizes: ["Taille Unique"],
    stock: 20
  }
];

const DEFAULT_PROMO_CODES = [
  { code: "DIVINE10", type: "percent", value: 10, active: true },
  { code: "BIENVENUE5", type: "percent", value: 5, active: true },
  { code: "DIVINE15", type: "percent", value: 15, active: true }
];

class DivinExpressDB {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem("DivinExpress_db_categories")) {
      localStorage.setItem("DivinExpress_db_categories", JSON.stringify(DEFAULT_CATEGORIES));
    }
    if (!localStorage.getItem("DivinExpress_db_subcategories")) {
      localStorage.setItem("DivinExpress_db_subcategories", JSON.stringify(DEFAULT_SUBCATEGORIES));
    }
    if (!localStorage.getItem("DivinExpress_db_products")) {
      localStorage.setItem("DivinExpress_db_products", JSON.stringify(DEFAULT_PRODUCTS));
    }
    const existingOrdersRaw = localStorage.getItem("DivinExpress_db_orders");
    const existingOrders = existingOrdersRaw ? JSON.parse(existingOrdersRaw) : [];
    if (existingOrders.length === 0) {
      localStorage.setItem("DivinExpress_db_orders", JSON.stringify(DEFAULT_ORDERS));
    }
    if (!localStorage.getItem("DivinExpress_db_promos")) {
      localStorage.setItem("DivinExpress_db_promos", JSON.stringify(DEFAULT_PROMO_CODES));
    }
  }

  getCategories() {
    return JSON.parse(localStorage.getItem("DivinExpress_db_categories"));
  }

  saveCategory(cat) {
    const list = this.getCategories();
    if (!list.some(c => c.slug === cat.slug)) {
      list.push(cat);
      localStorage.setItem("DivinExpress_db_categories", JSON.stringify(list));
    }
  }

  getSubcategories() {
    return JSON.parse(localStorage.getItem("DivinExpress_db_subcategories"));
  }

  getSubcategoriesForCategory(categorySlug) {
    return this.getSubcategories().filter(s => s.category_slug === categorySlug);
  }

  saveSubcategory(subcat) {
    const list = this.getSubcategories();
    if (!list.some(s => s.category_slug === subcat.category_slug && s.slug === subcat.slug)) {
      list.push(subcat);
      localStorage.setItem("DivinExpress_db_subcategories", JSON.stringify(list));
    }
  }

  getProducts() {
    return JSON.parse(localStorage.getItem("DivinExpress_db_products"));
  }

  saveProduct(prod) {
    const list = this.getProducts();
    const idx = list.findIndex(p => p.id === prod.id);
    if (idx !== -1) {
      list[idx] = prod;
    } else {
      list.push(prod);
    }
    localStorage.setItem("DivinExpress_db_products", JSON.stringify(list));
  }

  getOrders() {
    return JSON.parse(localStorage.getItem("DivinExpress_db_orders"));
  }

  saveOrder(order) {
    const list = this.getOrders();
    list.push(order);
    localStorage.setItem("DivinExpress_db_orders", JSON.stringify(list));
  }

  deleteProduct(id) {
    const list = this.getProducts().filter(p => p.id !== id);
    localStorage.setItem("DivinExpress_db_products", JSON.stringify(list));
  }

  deleteCategory(slug) {
    const categories = this.getCategories().filter(c => c.slug !== slug);
    localStorage.setItem("DivinExpress_db_categories", JSON.stringify(categories));
    const subcategories = this.getSubcategories().filter(s => s.category_slug !== slug);
    localStorage.setItem("DivinExpress_db_subcategories", JSON.stringify(subcategories));
  }

  deleteSubcategory(categorySlug, slug) {
    const list = this.getSubcategories().filter(s => !(s.category_slug === categorySlug && s.slug === slug));
    localStorage.setItem("DivinExpress_db_subcategories", JSON.stringify(list));
  }

  updateOrderStatus(orderId, status) {
    const list = this.getOrders();
    const order = list.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      localStorage.setItem("DivinExpress_db_orders", JSON.stringify(list));
    }
  }

  getPromoCodes() {
    return JSON.parse(localStorage.getItem("DivinExpress_db_promos") || "[]");
  }

  savePromoCode(promo) {
    const list = this.getPromoCodes();
    const idx = list.findIndex(p => p.code === promo.code);
    if (idx !== -1) {
      list[idx] = promo;
    } else {
      list.push(promo);
    }
    localStorage.setItem("DivinExpress_db_promos", JSON.stringify(list));
  }

  deletePromoCode(code) {
    let list = this.getPromoCodes();
    list = list.filter(p => p.code !== code);
    localStorage.setItem("DivinExpress_db_promos", JSON.stringify(list));
  }
}

window.db = new DivinExpressDB();
