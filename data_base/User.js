// user.js
const mongoose = require('mongoose');

// Определение схемы пользователя
const userSchema = new mongoose.Schema({
    userID: String,
});

// Создание модели пользователя на основе схемы
const User = mongoose.model('User', userSchema);


module.exports = User