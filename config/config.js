// config.js
const config = {
    development: {
        mongoUri : "mongodb+srv://shank:123321985@cluster0.3nn8t.mongodb.net/Evillium",
        port: 8080,
        baseUrl: ""
    },
    production: {
        mongoUri : "mongodb+srv://shank:123321985@cluster0.3nn8t.mongodb.net/Evillium",
        port: 8080,
        baseUrl: ""
    }
};

module.exports = process.env.NODE_ENV === 'production' ? config.production : config.development;