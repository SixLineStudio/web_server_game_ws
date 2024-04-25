const crypto = require('crypto');
const routes = require('./routes')
const clients = new Map();
const User = require('../data_base/User')
const Inventory = require('../data_base/Inventory')
const Level = require("../data_base/Level");
const jwt = require('jsonwebtoken')
const secretKey = require("../static_data/Keys");
const {v4: uuidv4} = require("uuid")
const {generateJwt} = require("./functions");


function handleConnection(ws) {

    console.log('Новое подключение');
    // Обработчик события при получении сообщения от клиента
    ws.on('message', function incoming(message) {

        console.log('Получено сообщение от клиента: %s', message);

        const data = JSON.parse(message);


        console.log(data)

        if (data.type === 'user_data') {
            connectUser(ws, data);
        } else {

            const action = routes[data.type]
            const client = clients.get(ws);

            if (action && client) {
                action(ws, client, message);
            } else {
                console.log("Типа: " + data.type + " для сообщения не существует")
            }

        }
    });

    // Обработчик события при закрытии соединения с клиентом
    ws.on('close', function close() {
        console.log('Соединение закрыто');
        clients.delete(ws);
    });
}


async function connectUser(ws, data) {
    try {
        let user;
        if (data.jwt === '') {
            if (data.platform === 'a') {
                user = await User.findOne({playId: data.id})
            } else {
                user = await User.findOne({appStoreId: data.id})
            }
        } else {
            user = await User.findOne({jwt: data.jwt});
            if (!user) {
                const obj = {type: "request_reg_data"}
                ws.send(JSON.stringify(obj))
                throw new Error("Пользователь не найден по токену. Отправлен запрос на получение регистрационных данных")
            }
        }

        if (user) {
            clients.set(ws, user.userID);
            console.log("Пользователь подключен:" + user.userID)
            OnUserConnected(ws, user.jwt);
        } else {
            registerUser(ws, data);

        }
    } catch (error) {
        console.error('Ошибка при подключении пользователя:', error);
    }
}

async function registerUser(ws, data) {
    /*   try {*/

    const userId = data.id

    // Создаю новый веб токен.
    const jwtToken = generateJwt();

    //Генерирую ID пользователья @todo Сделать проверку на существования пользователя с таким ID
    const uuid = uuidv4();
    // Создание нового пользователя
    const newUser = new User({
        userID: uuid,
        jwt: jwtToken,
        playId: data.platform === "a" ? userId : "",
        appStoreId: data.platform === "i" ? userId : "",
    });

    newUser.save()
        .then(user => {
            console.log('Пользователь сохранен:', user);
        })
        .catch(err => {
            console.error('Ошибка при сохранении пользователя:', err);
        });


    const newInventory = new Inventory({
        userID: uuid,
        money: 1000000,
        gems: 100,
        items: [],
        heroes: [{id: "BaseHero", level: 1}]
    });


    const inventory = await newInventory.save();
    if (inventory) {
        console.log('Инвентарь сохранен:', inventory);
    } else {
        console.error('Ошибка при сохранении Инвентаря:', err);
    }

    const newLevels = new Level({
        userID: uuid,
        levelsCompleted: [],
        levels: []
    });

    const levels = await newLevels.save();
    /*    if (heroes) {
            console.log("Уровни созданы")
        } else {
            console.log("Ошибка при создании Уровней")
        }*/
    console.log("Пользователь зарегестрирован:" + userId)
    clients.set(ws, uuid);
    console.log("Пользователь подключен:" + userId)

    OnUserConnected(ws, jwtToken);
    /*  } catch (e) {
          console.error(e);
      }*/

}


function OnUserConnected(ws, jwt) {

    try {
        console.log("JWT CONNECTz: " + jwt)
        const Obj = {type: "user_connected", jwt: jwt}
        ws.send(JSON.stringify(Obj))
    } catch (e) {
        console.log(e)
    }

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

