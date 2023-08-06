const ValidationManager = require("../middleware/validation");
const AppModule = require("../modules/app");
const ChatModule = require("../modules/chat");

const route = (app) => {
    app.post("/app", ValidationManager.validateAddApp, AppModule.createApp);
    app.post("/query", ValidationManager.validateQuery, ChatModule.query);
}

module.exports = route;