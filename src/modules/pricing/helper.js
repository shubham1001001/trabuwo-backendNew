/**
 * Calculates the seller payout based on the Listing Price (LP).
 * Formula: Payout = LP - (LP * CommissionRate)
 * 
 * @param {Number} listingPrice The base price set by the seller.
 * @param {Number} commissionRate The platform commission rate (as a decimal, e.g., 0.05 for 5%).
 * @returns {Number} The seller's final payout.
 */
const calculateSellerPayout = (listingPrice, commissionRate) => {
  if (listingPrice == null || listingPrice < 0) return 0;
  const commissionAmount = Number(listingPrice) * Number(commissionRate);
  return parseFloat((Number(listingPrice) - commissionAmount).toFixed(2));
};

/**
 * Calculates the final selling price for the buyer (RP - Reseller Price).
 * Formula: SellingPrice = LP + ResellerMargin + ShippingFee + PlatformFee
 * 
 * @param {Number} listingPrice Base seller price.
 * @param {Number} resellerMargin Margin added by reseller.
 * @param {Number} shippingFee Shipping fee charged to buyer.
 * @param {Number} platformFee Platform fee charged to buyer.
 * @returns {Number} The final price to be paid by the buyer.
 */
const calculateSellingPrice = (listingPrice, resellerMargin = 0, shippingFee = 0, platformFee = 0) => {
  const total = Number(listingPrice) + Number(resellerMargin) + Number(shippingFee) + Number(platformFee);
  return parseFloat(total.toFixed(2));
};

/**
 * Calculates the buyer price (selling price) incorporating platform fees and commission.
 * Formula: BuyerPrice = (SellerPrice + Shipping + PlatformFee) / (1 - CommissionRate)
 * 
 * @param {Number} sellerPrice The payout amount the seller wants.
 * @param {Number} commissionRate The platform commission rate (decimal).
 * @param {Number} platformFee The fixed platform fee.
 * @param {Number} shippingFee The shipping fee.
 * @returns {Number} The final buyer price rounded up.
 */
const calculateBuyerPrice = (sellerPrice, commissionRate = 0, platformFee = 0, shippingFee = 0) => {
  if (sellerPrice == null || isNaN(sellerPrice)) return 0;
  
  const payout = Number(sellerPrice);
  const commRate = Number(commissionRate);
  const platFee = Number(platformFee);
  const shipFee = Number(shippingFee);

  const buyerPrice = (payout + shipFee + platFee) / (1 - commRate);
  return Math.ceil(buyerPrice);
};

module.exports = {
  calculateSellerPayout,
  calculateSellingPrice,
  calculateBuyerPrice
};
