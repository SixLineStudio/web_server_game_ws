const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    userID: String,
    money: Number,
    gems: Number,
    items: [{
        id: String,
        level: Number,
        rarity: Number,
        isEquipped: Boolean
    }],
    heroes: [{
        id: String,
        level: Number,
    }]
});

// Создание модели инвентаря на основе схемы
const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory