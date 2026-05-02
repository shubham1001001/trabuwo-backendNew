require("dotenv").config();
const { User, Role, UserRole } = require("../src/modules/auth/model");
const { ProductVariant } = require("../src/modules/product/model");
const { UserAddress } = require("../src/modules/userAddress/model");
const sequelize = require("../src/config/database");
const jwt = require("jsonwebtoken");

async function getRealData() {
  try {
    await sequelize.authenticate();
    
    // 1. Get a buyer
    const buyerRole = await Role.findOne({ where: { name: 'buyer' } });
    if (!buyerRole) {
        console.log("No buyer role found");
        return;
    }

    const userRole = await UserRole.findOne({ where: { roleId: buyerRole.id } });
    if (!userRole) {
        console.log("No user found with buyer role");
        return;
    }

    const buyer = await User.findByPk(userRole.userId, {
      attributes: ['id', 'publicId', 'email', 'mobile']
    });

    if (!buyer) {
      console.log("No buyer user found");
      return;
    }

    // Generate JWT Token
    const jwtSecret = process.env.JWT_SECRET || "4385747fc47c4400d2a257499622a125";
    const token = jwt.sign({ id: buyer.id, roles: ['buyer'] }, jwtSecret, {
      expiresIn: "600m",
    });

    // 2. Get a product variant
    const variant = await ProductVariant.findOne({
      where: { isDeleted: false, isActive: true },
      attributes: ['id', 'publicId', 'trabuwoPrice', 'skuId']
    });

    if (!variant) {
      console.log("No active product variant found");
      return;
    }

    // 3. Get an address for this buyer
    const address = await UserAddress.findOne({
      where: { userId: buyer.id },
      attributes: ['id', 'publicId', 'name', 'phoneNumber']
    });

    console.log(JSON.stringify({
      token: token,
      buyer: {
        id: buyer.id,
        publicId: buyer.publicId,
        email: buyer.email,
        mobile: buyer.mobile
      },
      variant: {
        id: variant.id,
        publicId: variant.publicId,
        price: variant.trabuwoPrice,
        skuId: variant.skuId
      },
      address: address ? {
        id: address.id,
        publicId: address.publicId,
        name: address.name
      } : "No address found for this buyer"
    }, null, 2));

  } catch (error) {
    console.error("Error fetching real data:", error);
  } finally {
    await sequelize.close();
  }
}

getRealData();
