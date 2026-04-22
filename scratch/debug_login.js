const authService = require("../src/modules/auth/service");
const sequelize = require("../src/config/database");

async function test() {
    try {
        console.log("Testing authenticateWithOtp...");
        // This will likely fail with Msg91 error, which is fine, we want to see if it crashes (500) or throws Msg91Error (400)
        const result = await authService.authenticateWithOtp({ mobile: "919999999999", otp: "123456" });
        console.log("Result:", result);
    } catch (error) {
        console.error("Error Type:", error.constructor.name);
        console.error("Error Message:", error.message);
        console.error("Error Stack:", error.stack);
    } finally {
        await sequelize.close();
    }
}

test();
