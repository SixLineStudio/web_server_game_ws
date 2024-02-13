// db.js
const mongoose = require('mongoose');
const config = require('../config/config')

// URL подключения к вашей базе данных MongoDB
const mongoURI = config.mongoUri; // замените на адрес вашей базы данных

// Подключение к MongoDB
mongoose.connect(mongoURI)//, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;

// Обработка события подключения
db.on('connected', () => {
    console.log('Подключено к MongoDB');
});

// Обработка ошибки подключения
db.on('error', (err) => {
    console.error('Ошибка подключения к MongoDB:', err);
});

module.exports = db;