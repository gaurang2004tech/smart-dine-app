const mongoose = require('mongoose');
const MenuItem = require('./models/menuItems');
require('dotenv').config();

const menuItems = [
  {
    name: "Espresso",
    description: "Strong black coffee made by forcing steam through ground beans.",
    price: 90,
    category: "Coffee",
    image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04",
    isAvailable: true
  },
  {
    name: "Cappuccino",
    description: "Classic Italian drink made with espresso and steamed milk foam.",
    price: 140,
    category: "Coffee",
    image: "https://images.unsplash.com/photo-1534706936160-d5ee67737049",
    isAvailable: true
  },
  {
    name: "Margherita Pizza",
    description: "Classic pizza with tomato sauce, mozzarella, and fresh basil.",
    price: 250,
    category: "Food",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbad80ad50",
    isAvailable: true
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB...");
    
    await MenuItem.deleteMany({}); // Clears existing items
    await MenuItem.insertMany(menuItems);
    
    console.log("✅ Menu Seeded Successfully!");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();