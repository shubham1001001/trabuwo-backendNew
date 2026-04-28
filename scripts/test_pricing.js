const pricingHelper = require("../src/modules/pricing/helper");

async function test() {
  try {
    const platformFee = 15;
    const builtInShippingFee = 70;
    const commissionRate = 0.10;
    const sellerPrice = 100;
    
    console.log("Testing calculateBuyerPrice Helper:");
    console.log(`Seller wants: ₹${sellerPrice}, Commission: ${commissionRate*100}%, Platform: ₹${platformFee}, Shipping: ₹${builtInShippingFee}`);
    
    const buyerPrice = pricingHelper.calculateBuyerPrice(sellerPrice, commissionRate, platformFee, builtInShippingFee);
    
    console.log(`Calculated Buyer Price: ₹${buyerPrice}`);
    
    const commission = buyerPrice * commissionRate;
    console.log(`Commission Amount (10% of Buyer Price): ₹${commission.toFixed(2)}`);
    
    const sellerPayout = buyerPrice - commission - platformFee - builtInShippingFee;
    console.log(`Seller Payout (BuyerPrice - Commission - PlatformFee - Shipping): ₹${sellerPayout.toFixed(2)}`);
    console.log("-------------------");

  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    process.exit(0);
  }
}

test();
