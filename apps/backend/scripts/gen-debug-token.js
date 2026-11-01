// Temp debug helper: mint an admin access token (local repro only)
const fs = require("fs");
const path = require("path");
const jwt = require(path.join(__dirname, "..", "node_modules", "jsonwebtoken"));

const env = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
const secret = /(?:^|\n)JWT_ACCESS_SECRET=(.*)/.exec(env)[1].trim();

const token = jwt.sign(
    {
        sub: 1,
        name: "Debug Admin",
        email: "debug@local",
        mobileNumber: "+8801700000000",
        roles: { id: 1, rolename: "admin" },
    },
    secret,
    { expiresIn: "10m" },
);
console.log(token);
