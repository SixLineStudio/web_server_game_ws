const {randomUUID} = require('crypto')
const routes = require('./routes')
const clients = new Map();
const User = require('../data_base/User')
const Inventory = require('../data_base/Inventory')

function handleConnection(ws) {

    //  const id = randomUUID();

    console.log('Новое подключение');


    // Обработчик события при получении сообщения от клиента
    ws.on('message', function incoming(message) {

        console.log('Получено сообщение от клиента: %s', message);

        const data = JSON.parse(message);


        if (data.type === 'user_data') {

            console.log(`User Data: ${data.id}`);

            connectUser(ws, data.id);

        } else {

            const action = routes[data.type]
            const client = clients.get(ws);
            if (action && client) {
                action(client, message);
            } else {
                console.log("Типа: " + data.type + " для сообщения не существует")
            }

        }

        //ws.send(`Вы отправили сообщение`);
    });

    // Обработчик события при закрытии соединения с клиентом
    ws.on('close', function close() {
        console.log('Соединение закрыто');
        clients.delete(ws);
    });
}


async function connectUser(ws, id) {
    try {
        const user = await User.findOne({userID: id});
        if (user) {
            clients.set(ws, user.userID);
            console.log("Пользователь подключен:" + user.userID)
        } else {
            registerUser(id);
            console.log("Пользователь зарегестрирован:" + id)
        }
    } catch (error) {
        console.error('Ошибка при подключении пользователя:', error);
    }
}

function registerUser(userID) {

    /* if (typeof userID !== "string"){
         console.log('userID не стринг:', userID);
         return;
     }*/
    // Создание нового пользователя
    const newUser = new User({
        userID: userID,

    });

    newUser.save()
        .then(user => {
            console.log('Пользователь сохранен:', user);
        })
        .catch(err => {
            console.error('Ошибка при сохранении пользователя:', err);
        });


    const newInventory = new Inventory({
        userID: userID,
        money: 0,
        items: []

    });

    newInventory.save()
        .then(user => {
            console.log('Инвентарь сохранен:', user);
        })
        .catch(err => {
            console.error('Ошибка при сохранении Инвентаря:', err);
        });
}

/*async function findUser(userID) {
    // Находим пользователя по его имени
    return await User.findOne({userID: userID})
        .then(user => {
            if (user) {
                console.log('Найден пользователь:', user);
                return user;
            } else {
                console.log('Пользователь не найден');
                return null
            }
        })
        .catch(error => {
            console.error('Ошибка при поиске пользователя:', error);
        });
}*/


module.exports = {handleConnection};