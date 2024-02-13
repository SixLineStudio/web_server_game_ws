const Inventory = require('../data_base/Inventory')


const routes = {

    'add_items': (ws, userID, message) => {
        console.log("Add Items Fun")

        let itemsToAdd = [];

        const data = JSON.parse(message)
        data.items.forEach((value, index, array) => {
            let Item = {id: value.id, level: value.level, rarity: value.rarity};
            for (let x = 0; x < value.amount; ++x) {
                itemsToAdd.push(Item)
            }
        })

        Inventory.findOneAndUpdate(
            {userID: userID}, // Условие поиска документа
            {$push: {items: {$each: itemsToAdd}}}, // Обновление поля 'items'
            {new: true, upsert: true}).then(updatedInventory => {// Опции: возвращает обновленный документ, создает новый, если не найден
            console.log('Инвентарь успешно обновлен:', updatedInventory);
        })
            .catch(error => {
                console.error('Ошибка при обновлении инвентаря:', error);
            });

    },


    'request_inventory_data': async (ws, userID, message) => {

        const inventory = await Inventory.findOne({userID});
        if (inventory) {
            /* const modifiedInventory = inventory.map(item => {
                 return { ...item, type: 'get_inventory_data' };*/
            console.log({...inventory._doc, type: 'get_inventory_data'})// Добавляем переменную type

            ws.send(JSON.stringify({...inventory._doc, type: 'get_inventory_data'}));
        }
    },

    'SomeFun2': (ws, userID, message) => {


    },

    'SomeFun3': (ws, userID, message) => {


    },
};


module.exports = routes