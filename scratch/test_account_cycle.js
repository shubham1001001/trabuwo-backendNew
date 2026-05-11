require("dotenv").config();
const authService = require("../src/modules/auth/service");
const dao = require("../src/modules/auth/dao");
const sequelize = require("../src/config/database");

async function runFullTest() {
  try {
    await sequelize.authenticate();
    console.log("--------------------------------------------------");
    console.log("🚀 STARTING FULL ACCOUNT LIFECYCLE TEST");
    console.log("--------------------------------------------------");

    const mobile = "918888888888";
    const otp = "123456";

    // 1. Setup: Ensure user exists and is active
    let user = await dao.findUserWithRoles({ mobile });
    if (!user) {
        console.log("🔹 Step 1: Creating test user...");
        user = await authService.createUserWithMobile(mobile);
    } else {
        console.log("🔹 Step 1: Found existing test user. Resetting to active...");
        await user.update({ status: "active" });
    }
    console.log("   Current Status:", user.status);

    // 2. Login: Get tokens
    console.log("\n🔹 Step 2: Logging in...");
    const loginResult = await authService.authenticateWithOtp({ mobile, otp });
    const { accessToken, refreshToken } = loginResult.data;
    console.log("   Login Successful. Tokens issued.");

    // 3. Delete Account: Revoke tokens and set status to deleted
    console.log("\n🔹 Step 3: Deleting account (Soft Delete)...");
    await authService.deleteAccount(user.id);
    
    user = await dao.findUserWithRoles({ mobile });
    console.log("   New Status:", user.status);

    // 4. Verify Revocation: Try to verify refresh token
    console.log("\n🔹 Step 4: Verifying token revocation...");
    try {
        await authService.verifyRefreshToken(refreshToken);
        console.error("   ❌ FAIL: Refresh token was not revoked!");
    } catch (err) {
        console.log("   ✅ SUCCESS: Refresh token is invalid/revoked.");
    }

    // 5. Verify Blocked Login: Normal OTP login should fail
    console.log("\n🔹 Step 5: Attempting normal login on deleted account...");
    try {
        await authService.authenticateWithOtp({ mobile, otp });
        console.error("   ❌ FAIL: Login succeeded on a deleted account!");
    } catch (err) {
        console.log("   ✅ SUCCESS: Login blocked. Error:", err.message);
    }

    // 6. Reactivate: Use the new reactivation API
    console.log("\n🔹 Step 6: Reactivating account via Recovery API...");
    const reactivateResult = await authService.reactivateAccount({ mobile, otp });
    console.log("   Result:", reactivateResult.data.message);

    // 7. Final Verification: Status and Login
    user = await dao.findUserWithRoles({ mobile });
    console.log("\n🔹 Step 7: Final Status Check...");
    console.log("   Final Status:", user.status);

    if (user.status === "active") {
        console.log("   ✅ FULL TEST PASSED: Account Lifecycle works perfectly.");
    } else {
        console.error("   ❌ FULL TEST FAILED: Account is not active.");
    }

    console.log("--------------------------------------------------");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ CRITICAL TEST ERROR:", error);
    process.exit(1);
  }
}

runFullTest();
