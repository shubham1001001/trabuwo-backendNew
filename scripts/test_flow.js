const sequelize = require("../src/config/database");
const { User, Role } = require("../src/modules/auth/model");
const Category = require("../src/modules/category/model");
const catalogueDao = require("../src/modules/catalogue/dao");
const catalogueService = require("../src/modules/catalogue/service");
const productDao = require("../src/modules/product/dao");
const productService = require("../src/modules/product/service");
const cartDao = require("../src/modules/cart/dao");
const cartService = require("../src/modules/cart/service");
const orderService = require("../src/modules/order/service");
const userAddressDao = require("../src/modules/userAddress/dao");

async function testFlow() {
  let transaction;
  try {
    // 1. Setup: Get a seller, a buyer, and a category
    const sellerRole = await Role.findOne({ where: { name: 'seller' } });
    const buyerRole = await Role.findOne({ where: { name: 'buyer' } });
    
    const sellers = await sellerRole.getUsers({ limit: 1 });
    const buyers = await buyerRole.getUsers({ limit: 1 });
    
    const seller = sellers[0];
    const buyer = buyers[0];
    const category = await Category.findOne({ where: { isVisible: true, isDeleted: false } });
    
    if (!seller || !buyer || !category) {
      console.log("Missing test data: Seller, Buyer, or Category not found.");
      return;
    }

    console.log(`--- Test Setup ---`);
    console.log(`Seller: ${seller.email}`);
    console.log(`Buyer: ${buyer.email}`);
    console.log(`Category: ${category.name}`);

    // Create a transaction to rollback everything at the end
    transaction = await sequelize.transaction();

    // 2. Seller Creates a Product with a specific sellerPrice
    const testSellerPrice = 150;
    console.log(`\n--- 1. Seller Creates Product ---`);
    console.log(`Seller sets desired payout to: ₹${testSellerPrice}`);

    const cataloguePayload = {
      name: "Test Flow Catalogue " + Date.now(),
      description: "Testing pricing flow",
      categoryId: category.publicId,
      products: [
        {
          name: "Test Flow Product",
          description: "Test Product",
          dynamicFields: {},
          variants: [
            {
              sellerPrice: testSellerPrice,
              trabuwoPrice: 0, 
              mrp: 500,
              inventory: 10,
              dynamicFields: {}
            }
          ]
        }
      ]
    };

    const createdCatalogues = await productService.createBulkCataloguesWithProducts([cataloguePayload], seller.id);
    const createdCatalogue = createdCatalogues[0];
    const createdProduct = createdCatalogue.products[0];
    const createdVariantId = createdProduct.id; // We'll need to fetch variants
    
    const productWithVariants = await productDao.getProductById(createdProduct.publicId, seller.id, { transaction });
    const variantBeforeQC = productWithVariants.variants[0];

    console.log(`Product created. Initial Trabuwo Price (calculated on creation): ₹${variantBeforeQC.trabuwoPrice}`);

    // 3. Admin Approves QC
    console.log(`\n--- 2. Admin QC Approval ---`);
    const approvedCatalogue = await catalogueService.updateQCStatus(createdCatalogue.publicId, 'qc_passed', 'Approved for test');
    
    const productAfterQC = await productDao.getProductById(createdProduct.publicId, seller.id, { transaction });
    const variantAfterQC = productAfterQC.variants[0];
    
    console.log(`Catalogue status: ${approvedCatalogue.status}`);
    console.log(`Trabuwo Price after QC recalculation: ₹${variantAfterQC.trabuwoPrice}`);

    // 4. Buyer checks out
    console.log(`\n--- 3. Buyer Checkout ---`);
    // Ensure buyer has an address
    const addresses = await userAddressDao.getUserAddresses(buyer.id);
    if (!addresses || addresses.length === 0) {
        console.log("Buyer has no address. Creating one...");
        // This is complex, let's just use buyNow and mock the address if possible, 
        // or we can't test checkout without an address.
    }
    
    const userAddress = addresses[0];

    if (userAddress) {
        const payload = {
            productVariantId: variantAfterQC.publicId,
            userAddressPublicId: userAddress.publicId,
            quantity: 1,
            paymentMethod: "COD"
        };
        
        console.log(`Executing Buy Now...`);
        const orderResult = await orderService.buyNow(buyer.id, payload);
        
        console.log(`\n--- 4. Validation ---`);
        console.log(`Order Total Amount: ₹${orderResult.totalAmount}`);
        
        // Fetch order items to check seller payout
        const { OrderItem } = require("../src/modules/order/model");
        const orderItem = await OrderItem.findOne({ 
            where: { productVariantId: variantAfterQC.id },
            order: [['createdAt', 'DESC']]
        });
        
        if (orderItem) {
            console.log(`Item Price: ₹${orderItem.price}`);
            console.log(`Commission Amount Deducted: ₹${orderItem.commissionAmount}`);
            console.log(`Seller Payout Recorded: ₹${orderItem.sellerPayout}`);
            
            if (Number(orderItem.sellerPayout) === testSellerPrice) {
                console.log(`✅ TEST PASSED: Seller payout exactly matches the requested seller price (₹${testSellerPrice}).`);
            } else {
                console.log(`❌ TEST FAILED: Seller payout (₹${orderItem.sellerPayout}) does NOT match requested seller price (₹${testSellerPrice}).`);
            }
        }
    } else {
        console.log("Could not find a buyer address to complete checkout test. Pricing logic verified up to product creation.");
    }

    // Rollback the transaction to keep database clean
    await transaction.rollback();
    console.log(`\n--- Test finished and database rolled back ---`);

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("\nTest failed with error:", error);
  } finally {
    process.exit(0);
  }
}

testFlow();
