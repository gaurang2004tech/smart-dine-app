const express = require('express');
const router = express.Router();
const Order = require('../models/order'); // Adjust if your file is named Order.js
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.get('/insights', async (req, res) => {
  try {
    // 1. Fetch the 20 most recent paid orders
    const recentOrders = await Order.find({ status: { $regex: /paid/i } })
      .populate('items.menuItem')
      .sort({ createdAt: -1 })
      .limit(20);

    if (recentOrders.length === 0) {
      return res.json({ insight: "Not enough data yet! Get some customers to place orders first." });
    }

    // 2. Compress the orders into a readable string for the AI
    const orderSummary = recentOrders.map(order => {
      return order.items.map(i => i.menuItem ? i.menuItem.name : '').join(', ');
    }).join(' | ');

    // 3. Prompt the AI
    const prompt = `You are a highly paid restaurant consultant. Analyze these recent orders: [${orderSummary}]. Based on what people are buying together, give the owner ONE short, actionable, 2-sentence business tip to increase revenue (e.g., a combo to create, or an item to promote).`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo", // or gpt-4 if you prefer
    });

    res.json({ insight: completion.choices[0].message.content });

  } catch (error) {
    console.error(error);
    res.status(500).json({ insight: "AI is currently resting. Please try again later." });
  }
});

module.exports = router;