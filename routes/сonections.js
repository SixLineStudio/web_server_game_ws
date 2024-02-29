const crypto = require('crypto');
const routes = require('./routes')
const clients = new Map();
const User = require('../data_base/User')
const Inventory = require('../data_base/Inventory')
const Heroes = require("../data_base/Heroes");
const Level = require("../data_base/Level");
const EncryptionKey = require("../static_data/Keys");
const algorithm = 'aes-256-cbc'; // Алгоритм шифрования
const iv = crypto.randomBytes(16); // Инициализирующий вектор

const cipher = crypto.createCipheriv(algorithm, Buffer.from(EncryptionKey, 'hex'), iv);


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
                action(ws, client, message);
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


        const iv = Buffer.from('c0d33d3a5f1d9e2ac48188f9f7dcbbd3', 'hex'); // Используйте один и тот же IV при каждом запуске

        const cipher = crypto.createCipheriv(algorithm, Buffer.from(EncryptionKey, 'hex'), iv);
        let encryptedUserId = cipher.update(id, 'utf8', 'hex');
        encryptedUserId += cipher.final('hex');


        /*     const cipher = crypto.createCipheriv(algorithm, Buffer.from(EncryptionKey, 'hex'), iv);
             let encryptedUserId = cipher.update(id, 'utf8', 'hex');
             encryptedUserId += cipher.final('hex');*/

        console.log("зашифрованый пользователь:" + encryptedUserId)

        const user = await User.findOne({userID: encryptedUserId});
        if (user) {
            clients.set(ws, encryptedUserId);
            console.log("Пользователь подключен:" + encryptedUserId)
        } else {
            registerUser(ws, encryptedUserId);

        }
    } catch (error) {
        console.error('Ошибка при подключении пользователя:', error);
    }
}

async function registerUser(ws, userID) {
    try {

        console.log(typeof userID)
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


        const inventory = await newInventory.save();
        if (inventory) {
            console.log('Инвентарь сохранен:', inventory);

        } else {
            console.error('Ошибка при сохранении Инвентаря:', err);
        }

        const newHeroes = new Heroes({
            userID: userID,
            usedHero: "BaseHero",
            heroes: [{
                id: "BaseHero",
                level: 1
            }
            ]
        });
        const heroes = await newHeroes.save();
        if (heroes) {
            console.log("Герои созданы")
        } else {
            console.log("Ошибка при создании Героев")
        }


        const newLevels = new Level({
            userID: userID,
            levelsCompleted: [String],
            levels: [Object]
        });

        const levels = await newLevels.save();
        if (heroes) {
            console.log("Уровни созданы")
        } else {
            console.log("Ошибка при создании Уровней")
        }
        console.log("Пользователь зарегестрирован:" + userID)
        clients.set(ws, userID);
        console.log("Пользователь подключен:" + userID)

    } catch (e) {
        console.error(e);
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


/*

// Создаем дешифр AES
const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);

// Расшифровываем ID пользователя
let decryptedUserId = decipher.update(encryptedUserId, 'hex', 'utf8');
decryptedUserId += decipher.final('utf8');

console.log('Расшифрованный ID:', decryptedUserId);*/
