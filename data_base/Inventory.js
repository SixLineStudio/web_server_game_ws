const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    userID: String,
    money: Number,
    items: [{
        id: String,
        level: Number,
        rarity: Number,
        isEquipped: Boolean
    }]
});

// Создание модели инвентаря на основе схемы
const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory