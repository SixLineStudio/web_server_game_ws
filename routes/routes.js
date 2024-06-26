const Inventory = require('../data_base/Inventory')
const Level = require("../data_base/Level");
const [InventoryData, lootBoxPrice] = require("../static_data/InventoryData");
const ObjectId = require('mongoose').Types.ObjectId
const Rewards = require("../Components/LevelRewards")
const [heroUpgradeCost, itemUpgradeCost] = require("../static_data/Costs")


const routes = {


    'add_items': async (ws, userID, message) => {
        try {


            let itemsToAdd = [];

            const data = JSON.parse(message)
            data.items.forEach((value, index, array) => {
                if (value.id) {
                    let Item = {id: value.id, level: value.level, rarity: value.rarity, isEquipped: false};
                    for (let x = 0; x < value.amount; ++x) {
                        itemsToAdd.push(Item)
                    }
                }
            })

            await Inventory.findOneAndUpdate(
                {userID: userID}, // Условие поиска документа
                {$push: {items: {$each: itemsToAdd}}}, // Обновление поля 'items'
                {new: true, upsert: true}).then(updatedInventory => {// Опции: возвращает обновленный документ, создает новый, если не найден
            })
        } catch (e) {
            console.log(e)
        }

    },


    'request_inventory_data': async (ws, userID, message) => {
        await requestInventoryData(ws, userID);
    },


    'upgrade_item': async (ws, userID, message) => {
        const data = JSON.parse(message);
        // const objectID = new ObjectId(data._id);

        const inventory = await Inventory.findOne({userID}); //({userID, 'items._id': objectID}, {'items.$': 1});

        const objectId = new ObjectId(data._id);
        const itemIndex = inventory.items.findIndex(item => item._id.equals(objectId));

        // Если предмет найден в инвентаре
        if (itemIndex !== -1) {

            const price =  itemUpgradeCost(inventory.items[itemIndex].level)
             //inventory.items[itemIndex].level * 200;

            if (inventory.money >= price) {

                // Обновляем уровень предмета
                const level = inventory.items[itemIndex].level;
                inventory.items[itemIndex].level = level + 1;
                inventory.money = Math.max(inventory.money - price, 0);

                // Сохраняем изменения в базе данных
                await inventory.save();

                console.log("Предмет улучшен");
            }
        } else {
            console.log('Предмет не найден в инвентаре');
        }

    },


    'equip_item': (ws, userID, message) => {

        try {
            const data = JSON.parse(message);
            // const objectID = new ObjectId(data._id);

            const firstItemId = new ObjectId(data._id_1);

            if (data._id_2 === "") {
                Inventory.findOneAndUpdate(
                    {userID, 'items._id': firstItemId},
                    {$set: {'items.$.isEquipped': true}},
                    {new: false}
                ).then(updatedInventory => {
                    if (!updatedInventory) {
                        console.log('Инвентарь пользователя не найден');
                        return;
                    }

                    console.log('Обновленный инвентарь:', updatedInventory);
                })
                    .catch(error => {
                        console.error('Произошла ошибка при обновлении инвентаря:', error);
                    });
            } else {

                const secondItemId = new ObjectId(data._id_2);
                Inventory.findOneAndUpdate(
                    {userID, 'items._id': {$in: [firstItemId, secondItemId]}},
                    {
                        $set: {
                            'items.$[elem1].isEquipped': true,
                            'items.$[elem2].isEquipped': false
                        }
                    },
                    {
                        arrayFilters: [
                            {'elem1._id': firstItemId},
                            {'elem2._id': secondItemId}
                        ],
                        new: true
                    }
                )
                    .then(updatedInventory => {
                        if (!updatedInventory) {
                            console.log('Инвентарь пользователя не найден');
                            return;
                        }

                        console.log('Обновленный инвентарь:', updatedInventory);
                    })
                    .catch(error => {
                        console.error('Произошла ошибка при обновлении инвентаря:', error);
                    });

            }
        } catch (e) {
            console.log(e)
        }
    },


    'unequip_item': (ws, userID, message) => {
        try {
            const data = JSON.parse(message);
            const ItemId = new ObjectId(data._id);
            Inventory.findOneAndUpdate(
                {userID, 'items._id': ItemId},
                {$set: {'items.$.isEquipped': false}},
                {new: true}
            ).then(updatedInventory => {
                if (!updatedInventory) {
                    console.log('Инвентарь пользователя не найден');
                    return;
                }

                console.log('Обновленный инвентарь:', updatedInventory);
            })
                .catch(error => {
                    console.error('Произошла ошибка при обновлении инвентаря:', error);
                });
        } catch (e) {
            console.error(e)
        }
    },


    'combine_items': async (ws, userID, message) => {

        try {
            const data = JSON.parse(message);
            const firstItemId = new ObjectId(data._id_1);
            const secondItemId = new ObjectId(data._id_2);
            const thirdItemId = new ObjectId(data._id_3);

            if (firstItemId === secondItemId || secondItemId === thirdItemId) {
                return;
            }

            const inventory = await Inventory.findOne({userID});

            if (!inventory) {
                return;
            }

            const items = inventory.items;
            const firstItem = items.find(item => item._id.equals(firstItemId));
            const secondItem = items.find(item => item._id.equals(secondItemId));
            const thirdItem = items.find(item => item._id.equals(thirdItemId));


            if (firstItem && secondItem && thirdItem) {
                const itemId = firstItem.id;
                const rarity = firstItem.rarity;
                const isEquipped = firstItem.isEquipped;

                if (rarity < 6) {
                    if (firstItem.id === secondItem.id && secondItem.id === thirdItem.id) {
                        //Удаляю предметы с инвентаря
                        const updatedInventory = await Inventory.findOneAndUpdate(
                            {userID: userID},
                            {
                                $pull: {
                                    items: {_id: {$in: [firstItemId, secondItemId, thirdItemId]}}
                                }
                            },
                            {new: true} // Опция new: true возвращает обновленный документ
                        );
                        // Если удалил добавляю улучшеный и отправля. пользователю изменения
                        if (updatedInventory) {
                            await addNewItemToInventory(userID, {
                                id: itemId,
                                level: 1,
                                rarity: rarity + 1,
                                isEquipped: isEquipped
                            })
                            await requestInventoryData(ws, userID);

                        }
                    }
                }

            }

            // Далее вы можете выполнить необходимые операции с этими предметами
        } catch (error) {
            console.error('Произошла ошибка при поиске инвентаря:', error);
        }
    },

    'request_levels_data': async (ws, userID, message) => {

        console.log("request Levels Data !!!!!!!!!!!!!!!!")
        try {
            const levels = await Level.findOne({userID});
            if (levels) {
                ws.send(JSON.stringify({...levels._doc, type: 'get_levels_data'}));
            }
        } catch (e) {
            console.error(e)
        }
    },


    'change_level_progress': async (ws, userID, message) => {
        try {

            console.log("change_level_progress!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            console.log("rewards: " + Rewards);
            const data = JSON.parse(message);

            // Находим уровень по userID
            const foundLevel = await Level.findOne({userID});

            if (foundLevel) {
                // Проверяем, существует ли подуровень с указанным _id
                if (foundLevel.levels.find(level => level.id === data._id)) {
                    const levelIndex = foundLevel.levels.findIndex(level => level.id === data._id);
                    const level = foundLevel.levels[levelIndex];

                    // Проверяем, была ли уже получена награда за этот подуровень
                    if (!level.rewardsReceived.includes(data.progress)) {

                        if (Rewards.levels[data._id]) {
                            // Проверяем, существует ли подуровень с указанным _id в наградах для данного уровня
                            if (Rewards.levels[data._id][data.progress]) {
                                // Если награда существует, можно начать процесс получения награды

                                Rewards.levels[data._id][data.progress].items.forEach((value) => {
                                    addNewItemToInventory(userID, {
                                        id: value,
                                        level: 1,
                                        rarity: 0,
                                        isEquipped: false
                                    })
                                })

                                const inventory = await Inventory.findOne({userID: userID});
                                if (inventory) {
                                    if (Rewards.levels[data._id][data.progress].money || Rewards.levels[data._id][data.progress].gems) {

                                        if (Rewards.levels[data._id][data.progress].money) {
                                            inventory.money = inventory.money + Rewards.levels[data._id][data.progress].money;
                                        }
                                        if (Rewards.levels[data._id][data.progress].gems) {
                                            inventory.gems = inventory.gems + Rewards.levels[data._id][data.progress].gems;
                                        }
                                        inventory.save();
                                    }

                                }


                                // Добавляем _id подуровня в список полученных наград
                                foundLevel.levels[levelIndex].rewardsReceived.push(data.progress);


                                console.log("Награда получена успешно.");
                            } else {
                                console.log("Подуровень с указанным _id не найден в наградах для данного уровня.");
                            }

                            console.log("Награда получена успешно.");
                        } else {
                            console.log("Награда за этот подуровень уже получена.");
                        }
                    } else {
                        console.log("Уровень с указанным _id не найден.");
                    }

                    foundLevel.levels[levelIndex].progress = data.progress;
                    // Сохраняем обновленный уровень
                    await foundLevel.save();

                } else {


                    // Если уровень не найден, создаем новый
                    const newLevel = {
                        id: data._id,
                        progress: data.progress,
                        rewardsReceived: []
                    };

                    // foundLevel.levels.push(newLevel);
                    //   Добавляем новый уровень в массив levels
                    const updatedLevel = await Level.findOneAndUpdate(
                        {userID},
                        {$push: {levels: newLevel}},
                        {new: false}
                    )
                    console.log("Создан новый уровень:", updatedLevel);

                }
            } else {

            }
        } catch
            (e) {
            console.error("Ошибка:", e);
        }
    }
    ,


    'complete_level':
        async (ws, userID, message) => {

            //try {
            const data = JSON.parse(message);
            const levelIDToAdd = data.id;
            const money = data.money;
            const progress = data.progress;
            const isCompleted = data.completed;


            console.log("Completed: " + isCompleted);
            console.log(message);
            if (isCompleted === '1') {
                // Обновляем только если levelIDToAdd отсутствует в массиве levelsCompleted
                const updatedLevel = await Level.findOneAndUpdate(
                    {userID, levelsCompleted: {$ne: levelIDToAdd}},
                    {$addToSet: {levelsCompleted: levelIDToAdd}},
                    {new: false}
                );
            }

            let userLevel = await Level.findOne({userID});

            if (userLevel) {
                // Проверяем, существует ли у пользователя уровень с указанным levelIDToAdd
                const levelIndex = userLevel.levels.findIndex(level => level.id === levelIDToAdd);

                // Если уровень существует, обновляем его прогресс
                if (levelIndex !== -1) {
                    userLevel.levels[levelIndex].progress = progress;
                } else {
                    // Если уровень не существует, добавляем новый уровень с указанным прогрессом
                    userLevel.levels.push({id: levelIDToAdd, progress, rewardsReceived: 0});
                }

                // Сохраняем обновленного пользователя в базе данных
                await userLevel.save();
            }





            // Обновляем деньги (Money)
            await Inventory.findOneAndUpdate(
                {userID},
                {$inc: {money}},
                {new: false}
            );


            const userLevels = await Level.findOne({userID});

            // Проверяем, существует ли пользователь и его уровни
            if (userLevels) {
                // Находим уровень с идентификатором levelID в массиве levels пользователя
                const level = userLevels.levels.find(level => level.id == levelIDToAdd);
                console.log(userLevels)
                if (level) {
                    const rewardsReceived = level.rewardsReceived;
                    const rewardsForLevel = Rewards.levels[levelIDToAdd];

                    let RewardsToAdd = [];

                    if (rewardsForLevel) {
                        rewardsForLevel.forEach((reward) => {
                            if (reward.progress <= progress && reward.progress > rewardsReceived) {
                                RewardsToAdd.push(reward)
                            }
                        })
                    }

                    console.log("RewardsToAdd: " + RewardsToAdd)
                    const inventory = await Inventory.findOne({userID: userID});
                    if (inventory) {
                        await RewardsToAdd.forEach((reward) => {

                            inventory.money += reward.money;
                            //inventory.gems += reward.gems;

                            reward.items.forEach((item) => {

                                addNewItemToInventory(userID, {
                                    id: item,
                                    level: 1,
                                    rarity: 0,
                                    isEquipped: false
                                })
                            })
                        })

                        level.rewardsReceived = progress;
                        userLevels.save();
                        inventory.save();
                    }

                }


            }
        },


    'receive_level_reward':
        async (ws, userID, message) => {
            try {
                const data = JSON.parse(message);
                const {levelID, rewardLevel} = data;

                const foundLevel = await Level.findOne({userID, "levels.id": levelID});

                if (foundLevel) {
                    const level = foundLevel.levels.find(level => level.id === levelID);

                    if (level && level.progress >= rewardLevel) {
                        // Добавляем награду в массив rewardsReceived
                        const updatedLevel = await Level.findOneAndUpdate(
                            {userID, "levels.id": levelID},
                            {$push: {"levels.$.rewardsReceived": rewardLevel}},
                            {new: true}
                        );
                        console.log("Награда успешно добавлена:", updatedLevel);
                    } else {
                        console.log("Прогресс недостаточно высокий для получения награды или уровень не найден.");
                    }
                } else {
                    console.log("Уровень не найден.");
                }
            } catch (e) {
                console.error("Ошибка:", e);
            }
        },


    'buy_hero':
        async (ws, userID, message) => {


            try {

                const data = JSON.parse(message);
                const heroId = data._id;
                // Находим инвентарь пользователя по userID
                const inventory = await Inventory.findOne({userID: userID});

                if (!inventory) {
                    throw new Error("Инвентарь пользователя не найден.");
                }

                // Проверяем, достаточно ли у пользователя денег для покупки героя
                if (inventory.money < 200) {
                    throw new Error("У вас недостаточно денег для покупки героя.");
                }

                const isHeroExist = inventory.heroes.some(hero => hero.id === heroId);
                if (isHeroExist) {
                    throw new Error("Герой с указанным ID уже существует в вашем инвентаре.");
                }

                // Уменьшаем количество денег у пользователя на 200
                inventory.money -= 200;

                // Создаем нового героя
                const newHero = {
                    id: heroId, // Генерируйте уникальный id для героя
                    level: 0 // Уровень по умолчанию
                };

                // Добавляем нового героя в массив героев инвентаря пользователя
                inventory.heroes.push(newHero);

                // Сохраняем изменения
                await inventory.save();
                console.log("Герой успешно куплен!");

                const sendData = {type: "hero_purchased_successfully"};
                const jsonData = JSON.stringify(sendData);
                ws.send(jsonData);


            } catch (error) {
                console.error("Произошла ошибка:", error.message);
                // Выбрасываем ошибку, чтобы она была перехвачена снаружи этой функции

                const sendData = {type: "hero_purchased_failed"};
                const jsonData = JSON.stringify(sendData);
                ws.send(jsonData);
            }
        },


    'request_heroes_data':
        async (ws, userID, message) => {

            try {
                // Находим инвентарь пользователя по userID
                const inventory = await Inventory.findOne({userID: userID});

                if (!inventory) {
                    throw new Error("Инвентарь пользователя не найден.");
                }

                // Получаем список купленных героев и их уровень
                const heroesList = inventory.heroes.map(hero => ({
                    id: hero.id,
                    level: hero.level
                }));

                const jsonData = JSON.stringify({type: 'get_heroes_data', heroes: heroesList});
                ws.send(jsonData)

            } catch (error) {
                console.error("Произошла ошибка:", error.message);
            }

        },

    'upgrade_hero':
        async (ws, userID, message) => {

            try {

                const data = JSON.parse(message);
                const heroId = data._id;

                // Находим инвентарь пользователя по userID
                const inventory = await Inventory.findOne({userID: userID});

                if (!inventory) {
                    throw new Error("Инвентарь пользователя не найден.");
                }

                // Находим героя по его ID
                const heroIndex = inventory.heroes.findIndex(hero => hero.id === heroId);

                if (heroIndex === -1) {
                    throw new Error("Герой с указанным ID не найден в вашем инвентаре.");
                }

                // Подсчитываем стоимость улучшения уровня героя
                const upgradeCost = heroUpgradeCost(inventory.heroes[heroIndex].level);


                // Проверяем, достаточно ли у пользователя денег для улучшения
                if (inventory.money < upgradeCost) {
                    throw new Error("У вас недостаточно денег для улучшения уровня героя.");
                }

                // Уменьшаем количество денег у пользователя


                const money = inventory.money -= upgradeCost;

                // Увеличиваем уровень героя
                inventory.heroes[heroIndex].level++;
                updateMoneyOnClient(ws, money);
                // Сохраняем изменения
                await inventory.save();


                console.log("Уровень героя успешно увеличен!");

            } catch (error) {
                console.error("Произошла ошибка:", error.message);
            }


        },


    'open_loot_box':
        async (ws, userID, message) => {

            try {
                const data = JSON.parse(message);
                const inventory = await Inventory.findOne({userID});


                const price = lootBoxPrice[data._id];
                if (inventory.money >= price) {

                    // Обновляем уровень предмета
                    inventory.money = Math.max(inventory.money - price, 0);

                    const items = InventoryData.EquipmentItems;
                    const itemID = items[Math.floor(Math.random() * items.length)]


                    await addNewItemToInventory(userID, {
                        id: itemID,
                        level: 1,
                        rarity: 1,
                        isEquipped: false
                    });

                    // Сохраняем изменения в базе данных
                    await inventory.save();

                    await lootBoxResult(ws, userID, itemID);

                }
            } catch (e) {
                console.log(e);
            }
        },


    'request_level_rewards_data':
        (ws, userID, message) => {
            try {
                const data = {type: "levels_rewards", levels: Rewards.levels}
                console.log(data)
                ws.send(JSON.stringify(data));
            } catch (e) {
                console.log(e)
            }
        },

    'clear_progress':
        async (ws, userID, message) => {
            try {
                const inventory = await Inventory.findOne({userID});
                if (inventory) {
                    inventory.items = [];
                    inventory.money = 1000;
                    inventory.gems = 1000;
                    inventory.heroes = [{id: "BaseHero", level: 1}]
                    inventory.save();
                }
                const level = await Level.findOne({userID});
                if (level) {
                    level.levelsCompleted = [];
                    level.levels = [];
                    level.save();
                }
            } catch (e) {
                console.log(e)
            }
        },


    'SomeFun':
        (ws, userID, message) => {


        },
};


async function lootBoxResult(ws, userID, itemID) {

    const dataToSend = {type: "loot_box_result", item: itemID};
    ws.send(JSON.stringify(dataToSend));
    await requestInventoryData(ws, userID);
}

async function addNewItemToInventory(userID, newItemData) {
    try {
        // Находим инвентарь по userID
        let updatedInventory = await Inventory.findOneAndUpdate(
            {userID: userID}, // Условие поиска инвентаря
            {$push: {items: newItemData}}, // Добавление нового предмета в массив items
            {new: true, upsert: true} // Опции: возвращает обновленный документ, создает новый, если не найден
        );

        console.log('Предмет добавлен:');
        return updatedInventory;
    } catch (error) {
        console.error('Ошибка при добавлении предмета:', error);
        throw error;
    }
}

async function requestInventoryData(ws, userID) {
    try {
        const inventory = await Inventory.findOne({userID});
        if (inventory) {
            ws.send(JSON.stringify({...inventory._doc, type: 'get_inventory_data'}));
        }
    } catch (e) {
        console.error(e)
    }

}


function updateMoneyOnClient(ws, money) {

    try {
        const dataObject = {type: "money_data", money: money};
        const jsonData = JSON.stringify(dataObject);
        console.log(jsonData)
        ws.send(jsonData);
    } catch (e) {
        console.log(e);
    }
}

function updateGemsOnClient(ws, gems) {

    try {
        const dataObject = {type: "gems_data", gems};
        const jsonData = JSON.stringify(dataObject);
        console.log(jsonData)
        ws.send(jsonData);
    } catch (e) {
        console.log(e);
    }
}

module.exports = routes

