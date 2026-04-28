/**
 * Helper utility for calculating product prices based on seller requirements and platform fees.
 */

/**
 * Calculates the final price shown to the buyer, ensuring the seller gets their desired payout.
 * Formula: BuyerPrice = (SellerPrice + BuiltInShippingFee + PlatformFee) / (1 - CommissionRate)
 * 
 * Explanation:
 * When a buyer pays `BuyerPrice`, the platform deducts commission based on this price.
 * Commission Amount = BuyerPrice * CommissionRate
 * Remaining = BuyerPrice - CommissionAmount = BuyerPrice * (1 - CommissionRate)
 * Out of this remaining, we must pay for Shipping and Platform Fee.
 * What's left must equal SellerPrice.
 * Therefore: SellerPrice = (BuyerPrice * (1 - CommissionRate)) - BuiltInShippingFee - PlatformFee
 * Rearranging for BuyerPrice:
 * BuyerPrice * (1 - CommissionRate) = SellerPrice + BuiltInShippingFee + PlatformFee
 * BuyerPrice = (SellerPrice + BuiltInShippingFee + PlatformFee) / (1 - CommissionRate)
 * 
 * @param {Number} sellerPrice The payout amount the seller wants to receive.
 * @param {Number} commissionRate The platform commission rate (as a decimal, e.g., 0.10 for 10%).
 * @param {Number} platformFee The fixed platform fee per item.
 * @param {Number} builtInShippingFee The average shipping cost built into the price to offer "Free Delivery".
 * @returns {Number} The calculated buyer price, rounded to 2 decimal places.
 */
const calculateBuyerPrice = (sellerPrice, commissionRate, platformFee = 0, builtInShippingFee = 0) => {
  if (sellerPrice == null || sellerPrice < 0) {
    return 0;
  }
  
  // Prevent division by zero or negative values if commission rate is >= 100%
  const safeCommissionRate = Math.min(commissionRate, 0.99);
  
  const buyerPrice = (Number(sellerPrice) + Number(builtInShippingFee) + Number(platformFee)) / (1 - safeCommissionRate);
  
  return parseFloat(buyerPrice.toFixed(2));
};

module.exports = {
  calculateBuyerPrice
};
