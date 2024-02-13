const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    userID: String,
    money: Number,
    items: [{
        name: String,
        quantity: Number,
        weight: Number // Пример добавления дополнительного числового поля
    }]
});

// Создание модели инвентаря на основе схемы
const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory