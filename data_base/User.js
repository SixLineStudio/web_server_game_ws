// user.js
const mongoose = require('mongoose');

// Определение схемы пользователя
const userSchema = new mongoose.Schema({
    userID: String,
});

// Создание модели пользователя на основе схемы
const User = mongoose.model('User', userSchema);


/*const inventorySchema = new mongoose.Schema({
    userID: String,
    money: Number,
    items: [{
        name: String,
        quantity: Number,
        weight: Number // Пример добавления дополнительного числового поля
    }]
});

// Создание модели инвентаря на основе схемы
const Inventory = mongoose.model('Inventory', inventorySchema);*/

module.exports = User