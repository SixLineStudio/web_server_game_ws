const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    userID: String,
    levels: [{
        id: String,
        completed: Number,
        inLevelRewards: Number,
        completedRewardReceived: Boolean
    }]
});

// Создание модели инвентаря на основе схемы
const Level = mongoose.model('Level', inventorySchema);

module.exports = Level