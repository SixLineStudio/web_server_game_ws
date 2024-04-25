const mongoose = require('mongoose');

const levelsSchema = new mongoose.Schema({
    userID: String,
    levelsCompleted: [String],
    levels: [{
        id: String,
        progress: Number,
        rewardsReceived: Number
    }]
});

// Создание модели инвентаря на основе схемы
const Level = mongoose.model('Level', levelsSchema);

module.exports = Level