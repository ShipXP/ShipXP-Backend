"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_1 = require("./lib/db");
const missions_1 = __importDefault(require("./routes/missions"));
const ledger_1 = __importDefault(require("./routes/ledger"));
const github_1 = __importDefault(require("./routes/webhook/github"));
const guilds_1 = __importDefault(require("./routes/guilds"));
const ai_1 = __importDefault(require("./routes/ai"));
const leaderboard_1 = __importDefault(require("./routes/leaderboard"));
const admin_1 = __importDefault(require("./routes/admin"));
const confirmations_1 = require("./jobs/confirmations");
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// Initialize services
try {
    (0, db_1.initDb)();
}
catch (err) {
    console.error('Failed to initialize services:', err);
    process.exit(1);
}
// Use CORS middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.send('ShipXP Backend is running!');
});
// Mount the API routes
app.use('/api/missions', missions_1.default);
app.use('/api/ledger', ledger_1.default);
app.use('/api/webhook', github_1.default);
app.use('/api/guilds', guilds_1.default);
app.use('/api/ai', ai_1.default);
app.use('/api/leaderboard', leaderboard_1.default);
app.use('/api/admin', admin_1.default);
// Start the confirmation job
(0, confirmations_1.startConfirmationJob)(15000); // Run every 15 seconds
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
exports.default = app;
