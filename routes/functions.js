const jwt = require("jsonwebtoken");
const secretKey = require("../static_data/Keys");

function generateJwt(userId) {
    const payload = {userId};
    return jwt.sign(payload, secretKey);
}

module.exports = {generateJwt}