require("dotenv").config();
const { User, Role } = require("./src/modules/auth/model");
const sequelize = require("./src/config/database");

async function fixUserRole() {
    try {
        await sequelize.authenticate();
        console.log("Connected to DB");

        // Find the most recent user created via email
        const user = await User.findOne({
            order: [['createdAt', 'DESC']],
            where: {
                mobile: null
            }
        });

        if (!user) {
            console.log("No user found with empty mobile (assuming email-only user)");
            return;
        }

        console.log(`Found user: ${user.email} (id: ${user.id})`);

        // Find the admin role
        const adminRole = await Role.findOne({ where: { name: 'admin' } });
        if (!adminRole) {
            console.log("Admin role not found in DB. Creating it...");
            // Usually seeded, but let's be safe
            await Role.bulkCreate([
                { name: 'admin' },
                { name: 'buyer' },
                { name: 'seller' }
            ], { ignoreDuplicates: true });
        }

        const roleToAssign = await Role.findOne({ where: { name: 'admin' } });
        await user.setRoles([roleToAssign]);

        console.log(`Successfully assigned 'admin' role to ${user.email}`);

        // Verify
        const updatedUser = await User.findByPk(user.id, {
            include: [{ model: Role, as: 'Roles' }]
        });
        console.log("User roles now:", updatedUser.Roles.map(r => r.name));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sequelize.close();
    }
}

fixUserRole();
