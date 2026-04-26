const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    phoneNumber: { type: String, required: true, unique: true },
    name: String,
    points: { type: Number, default: 0 },
    tier: {
        type: String,
        enum: ['Silver', 'Gold', 'Black Card'],
        default: 'Silver'
    },
    rewardProgress: { type: Number, default: 0 }, // 🆕 Tracking 0-1000 points for Black Card gifts
    unclaimedGifts: { type: Number, default: 0 }, // 🆕 Number of ready-to-claim gifts

    memberSince: { type: Date, default: Date.now },

    // 💳 Digital Wallet Fields
    walletBalance: { type: Number, default: 0 },
    transactions: [{
        type: { type: String, enum: ['Credit', 'Debit'] },
        amount: Number,
        reason: String,
        timestamp: { type: Date, default: Date.now }
    }]
});

customerSchema.methods.awardPoints = async function (amount) {
    this.points += amount;

    // Tier logic
    if (this.points >= 2000) {
        if (this.tier !== 'Black Card') {
            this.tier = 'Black Card';
            this.rewardProgress = 0;
            this.unclaimedGifts += 1; // 🎁 Welcome Gift for reaching Black Card!
            console.log(`🥇 Welcome to Black Card! Gift awarded.`);
        } else {
            // Recurring Reward Logic for existing Black Card holders
            this.rewardProgress += amount;
            while (this.rewardProgress >= 1000) {
                this.unclaimedGifts += 1;
                this.rewardProgress -= 1000;
                console.log(`🎁 Recurring Gourmet Reward triggered!`);
            }
        }
    } else if (this.points >= 500) {
        this.tier = 'Gold';
    } else {
        this.tier = 'Silver';
    }
    return this.save();
};

module.exports = mongoose.model('Customer', customerSchema);
