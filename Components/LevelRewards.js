const fs = require('fs');

let Rewards = {
    "levels": {
        "Level_1":
            [
                {
                    "progress": 1,
                    "items": ["Sword_1", "Sword_1"],
                    "money": 100,
                    "gems": 0
                },
                {
                    "progress": 2,
                    "items": ["Axe_1", "Axe_1"],
                    "money": 150,
                    "gems": 450
                }
            ],
        "Level_2":
            [
                {
                    "progress": 1,
                    "items": ["Sword_1", "Sword_1"],
                    "money": 100,
                    "gems": 400
                },
                {
                    "progress": 2,
                    "items": ["Axe_1", "Axe_1"],
                    "money": 150,
                    "gems": 450
                }
            ],
        "Level_3":
            [
                {
                    "progress": 1,
                    "items": ["Sword_1", "Sword_1"],
                    "money": 100,
                    "gems": 400
                },
                {
                    "progress": 2,
                    "items": ["Axe_1", "Axe_1"],
                    "money": 150,
                    "gems": 450
                }
            ]

    }
};

/*async function ReadRewards(){
    fs.readFile('static_data/LevelRewards.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Ошибка при чтении файла:', err);
            return Rewards;
        }
        try {
            return Rewards = JSON.parse(data);

        } catch (parseError) {
            console.error('Ошибка при парсинге JSON:', parseError);
        }
    });
    return Rewards;
}


ReadRewards();*/

module.exports = Rewards;
