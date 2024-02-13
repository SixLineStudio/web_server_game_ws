const Inventory = require('../data_base/Inventory')


const routes = {

    'add_items': async (userID, message) => {
        const InventoryData = await Inventory.findOne({userID});
        if (InventoryData) {
            const data = JSON.parse(message)
            data.items.forEach((value, index, array)=>{
                value.name
            })
        }

    },
    'SomeFun': (userID, message) => {


    },
};


module.exports = routes