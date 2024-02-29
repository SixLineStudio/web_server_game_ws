const mongoose = require('mongoose');

const heroesSchema = new mongoose.Schema({
    userID: String,
    heroes: [{
        id: String,
        level: Number,
    }]
});

// Создание модели инвентаря на основе схемы
const Heroes = mongoose.model('Hero', heroesSchema);

module.exports = Heroes