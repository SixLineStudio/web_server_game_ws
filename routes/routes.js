const Inventory = require('../data_base/Inventory')
const ObjectId = require('mongoose').Types.ObjectId

const routes = {


    'add_items': async (ws, userID, message) => {
        try {


            let itemsToAdd = [];

            const data = JSON.parse(message)
            data.items.forEach((value, index, array) => {
                let Item = {id: value.id, level: value.level, rarity: value.rarity, isEquipped: false};
                for (let x = 0; x < value.amount; ++x) {
                    itemsToAdd.push(Item)
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

            const price = inventory.items[itemIndex].level * 200;

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
                            { /* ваш критерий поиска инвентаря */},
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
                            console.log("3")
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


    'SomeFun': (ws, userID, message) => {


    },
};


async function addNewItemToInventory(userID, newItemData) {
    try {
        // Находим инвентарь по userID
        let updatedInventory = await Inventory.findOneAndUpdate(
            {userID: userID}, // Условие поиска инвентаря
            {$push: {items: newItemData}}, // Добавление нового предмета в массив items
            {new: true, upsert: true} // Опции: возвращает обновленный документ, создает новый, если не найден
        );

        console.log('Инвентарь успешно обновлен:', updatedInventory);
        return updatedInventory;
    } catch (error) {
        console.error('Ошибка при обновлении инвентаря:', error);
        throw error;
    }
}

async function requestInventoryData(ws, userID) {
    try {
        const inventory = await Inventory.findOne({userID});
        if (inventory) {
            /* const modifiedInventory = inventory.map(item => {
                 return { ...item, type: 'get_inventory_data' };*/
            console.log({...inventory._doc, type: 'get_inventory_data'})// Добавляем переменную type

            ws.send(JSON.stringify({...inventory._doc, type: 'get_inventory_data'}));
        }
    } catch (e) {
        console.error(e)
    }

}

module.exports = routes

