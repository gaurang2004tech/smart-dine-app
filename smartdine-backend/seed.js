const mongoose = require('mongoose');
const MenuItem = require('./models/menuItems');
const Staff = require('./models/Staff');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const menuItems = [
  // --- BEVERAGES & COFFEE ---
  {
    name: "Golden Crema Espresso",
    description: "Rich, intense double shot of Arabica beans with a thick, golden crema.",
    price: 120,
    category: "Beverages",
    image: "http://192.168.1.4:3000/images/espresso.png",
    dietaryType: "Vegan",
    inStock: true
  },
  {
    name: "Velvet Oat Latte",
    description: "Smooth espresso blended with creamy oat milk and a touch of vanilla.",
    price: 180,
    category: "Beverages",
    image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80",
    dietaryType: "Vegan",
    inStock: true
  },
  {
    name: "Matcha Green Tea Latte",
    description: "Premium ceremonial grade matcha whisked with steamed almond milk.",
    price: 210,
    category: "Beverages",
    image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=800&q=80",
    dietaryType: "Vegan",
    inStock: true
  },

  // --- DIGITAL WINE & SPIRIT CELLAR (🆕 elite) ---
  {
    name: "Château Margaux 2015",
    description: "A classic Bordeaux of immense depth and elegance with velvety tannins.",
    price: 18500,
    category: "Cellar",
    image: "http://192.168.1.4:3000/images/wine.png",
    dietaryType: "None",
    origin: "Bordeaux, France",
    vintage: "2015",
    isCellar: true,
    sommelierNote: "A masterclass in balance. Notes of blackcurrant, violet, and cedar. Pairs perfectly with Wagyu Filet.",
    inStock: true
  },
  {
    name: "Dalmore 25 Year Single Malt",
    description: "Rare Highland Scotch finished in Graham’s Port pipes.",
    price: 22000,
    category: "Cellar",
    image: "http://192.168.1.4:3000/images/whisky.png",
    dietaryType: "None",
    origin: "Highlands, Scotland",
    vintage: "25 Year",
    isCellar: true,
    sommelierNote: "Exotic marzipan, chocolate truffles, and ginger. A truly regal spirit for the discerning palate.",
    inStock: true
  },
  {
    name: "Don Julio 1942 Añejo",
    description: "Celebrated Tequila aged in small batch oak barrels.",
    price: 12500,
    category: "Cellar",
    image: "https://images.unsplash.com/photo-1516535794938-6063878f08cc?auto=format&fit=crop&w=800&q=80",
    dietaryType: "None",
    origin: "Jalisco, Mexico",
    vintage: "Añejo",
    isCellar: true,
    sommelierNote: "Rich caramel and chocolate on the nose. Smooth oak and warm vanilla on the finish.",
    inStock: true
  },
  {
    name: "Champagne Royale Reserve",
    description: "Crisp, golden bubbles with notes of green apple and white flowers.",
    price: 8500,
    category: "Cellar",
    image: "https://images.unsplash.com/photo-1594460751084-58bc06a0d50a?auto=format&fit=crop&w=800&q=80",
    dietaryType: "None",
    origin: "Champagne, France",
    vintage: "NV",
    isCellar: true,
    sommelierNote: "Lively acidity with a creamy texture. The perfect aperitif for a grand celebration.",
    inStock: true
  },
  {
    name: "The Macallan Reflexion",
    description: "Exceptional mahogany-hued whisky with complex floral notes.",
    price: 28000,
    category: "Cellar",
    image: "https://images.unsplash.com/photo-1582819509237-ca5fd3bc5a18?auto=format&fit=crop&w=800&q=80",
    dietaryType: "None",
    origin: "Speyside, Scotland",
    vintage: "Rare Cask",
    isCellar: true,
    sommelierNote: "Rich spices, soft vanilla, and fresh apples. A complex symphony of flavor.",
    inStock: true
  },

  // --- SIGNATURE STARTERS ---
  {
    name: "Murg Malai Tikka",
    description: "Chicken morsels marinated in cream, cheese, and cardamom.",
    price: 420,
    category: "Starters",
    image: "https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=800&q=80",
    dietaryType: "Non-Veg",
    isSpicy: true,
    inStock: true
  },
  {
    name: "Truffle Arancini",
    description: "Crispy risotto balls suffused with black truffle and melted mozzarella.",
    price: 340,
    category: "Starters",
    image: "http://192.168.1.4:3000/images/arancini.png",
    dietaryType: "Veg",
    inStock: true
  },

  // --- ARTISANAL BREADS (🆕 BREADS) ---
  {
    name: "Butter Garlic Naan",
    description: "Clay-oven baked flatbread topped with minced garlic and Amul butter.",
    price: 65,
    category: "Breads",
    image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80",
    dietaryType: "Veg",
    inStock: true
  },
  {
    name: "Laccha Paratha",
    description: "Multi-layered whole wheat bread baked in the tandoor.",
    price: 75,
    category: "Breads",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80",
    dietaryType: "Veg",
    inStock: true
  },
  {
    name: "Artisanal Sourdough Slice",
    description: "Two slices of our 48-hour fermented sourdough with herb butter.",
    price: 110,
    category: "Breads",
    image: "https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&w=800&q=80",
    dietaryType: "Vegan",
    inStock: true
  },

  // --- ELITE MAINS ---
  {
    name: "Filet Mignon (Wagyu)",
    description: "7oz center-cut tenderloin with a peppercorn crust and red wine jus.",
    price: 1450,
    category: "Main Course",
    image: "http://192.168.1.4:3000/images/steak.png",
    dietaryType: "Non-Veg",
    inStock: true
  },
  {
    name: "Braised Lamb Shank",
    description: "12-hour slow-cooked lamb in a red wine reduction on parmesan mash.",
    price: 850,
    category: "Main Course",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    dietaryType: "Non-Veg",
    inStock: true
  },
  {
    name: "Wild Mushroom Risotto",
    description: "Creamy arborio rice with porcini, shiitake, and 24-month aged parmesan.",
    price: 480,
    category: "Main Course",
    image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=800&q=80",
    dietaryType: "Veg",
    inStock: true
  },
  {
    name: "Silk Route Paneer Lababdar",
    description: "Soft malai paneer simmered in a rich tomato and cashew gravy.",
    price: 410,
    category: "Main Course",
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80",
    dietaryType: "Veg",
    isSpicy: true,
    inStock: true
  },

  // --- DESSERTS ---
  {
    name: "Signature Lava Cake",
    description: "Warm Belgian chocolate cake with a molten center.",
    price: 320,
    category: "Dessert",
    image: "http://192.168.1.4:3000/images/lavacake.png",
    dietaryType: "Veg",
    inStock: true
  },
  {
    name: "French Macaron Box",
    description: "Assortment of 6 delicate macarons: Pistachio, Raspberry, and Caramel.",
    price: 450,
    category: "Dessert",
    image: "https://images.unsplash.com/photo-1569864358642-9d1619702661?auto=format&fit=crop&w=800&q=80",
    dietaryType: "Veg",
    inStock: true
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB...");

    console.log("Emptying current menu...");
    await MenuItem.deleteMany({});

    console.log("Emptying current staff...");
    await Staff.deleteMany({});

    console.log(`Inserting ${menuItems.length} new items...`);
    await MenuItem.insertMany(menuItems);

    // Create a default admin account
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    const admin = new Staff({
      username: 'admin',
      password: hashedPassword,
      role: 'admin'
    });
    await admin.save();

    console.log("✅ Menu Seeded & Admin Account Created! 🍽️🔐");
    process.exit();
  } catch (err) {
    console.error("❌ Seeding Error:", err);
    process.exit(1);
  }
};

seedDB();