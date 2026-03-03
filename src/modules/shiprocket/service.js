const shiprocketAxios = require("./axiosConfig");
const dao = require("./dao");
const {
  ExternalServiceError,
  ValidationError,
  NotFoundError,
} = require("../../utils/errors");
const { handleAxiosError } = require("../../utils/axiosError");
const logger = require("../../config/logger");

exports.calculateShippingRates = async (requestData) => {
  const response = await shiprocketAxios.post(
    "/external/courier/serviceability/",
    requestData
  );

  if (response.data && response.data.status === 200) {
    return response.data.data;
  }

  throw new ExternalServiceError(
    response.data?.message || "Failed to calculate shipping rates",
    "SHIPROCKET"
  );
};

exports.getEstimatedDeliveryDate = async (requestData) => {
  const response = await shiprocketAxios.post(
    "/external/courier/serviceability/",
    requestData
  );

  if (response.data && response.data.status === 200) {
    return response.data.data;
  }

  throw new ExternalServiceError(
    response.data?.message || "Failed to get estimated delivery date",
    "SHIPROCKET"
  );
};

exports.createOrder = async (orderId, buyerId) => {
  const order = await dao.getOrderWithDetails(orderId);

  if (!order) {
    throw new NotFoundError("Order not found");
  }

  const existingShipment = await dao.findShipmentByOrderId(orderId);
  if (existingShipment) {
    throw new ValidationError("Shipment already exists for this order");
  }

  if (!order.buyerAddress || !order.buyerAddress.location) {
    throw new ValidationError("Buyer address is required");
  }

  if (!order.buyer) {
    throw new ValidationError("Buyer information is required");
  }

  if (!order.items || order.items.length === 0) {
    throw new ValidationError("Order must have at least one item");
  }

  const deliveryAddress = {
    name: order.buyer.name || "Trabuwo", //TODO: add buyer field
    address: `${order.buyerAddress.buildingNumber || ""} ${
      order.buyerAddress.street || ""
    }`.trim(),
    address_2: order.buyerAddress.landmark || "",
    city: order.buyerAddress.location.city,
    state: order.buyerAddress.location.state,
    country: "India",
    pin_code: order.buyerAddress.location.pincode,
    phone: order.buyer.mobile || "",
    email: order.buyer.email || "",
  };

  const orderItems = order.items.map((item) => {
    const product = item.productVariant?.product;
    return {
      name: product?.name || "",
      sku: item.productVariant?.skuId,
      units: item.quantity,
      selling_price: item.productVariant?.trabuwoPrice,
      discount: 0,
      tax: 0,
      hsn: 0,
    };
  });

  const requestData = {
    order_id: "123",
    order_date: order.createdAt.toISOString().split("T")[0],
    pickup_location: "Home",
    comment: "",
    billing_customer_name: deliveryAddress.name,
    billing_last_name: "",
    billing_address: deliveryAddress.address,
    billing_address_2: deliveryAddress.address_2,
    billing_city: deliveryAddress.city,
    billing_pincode: deliveryAddress.pin_code,
    billing_state: deliveryAddress.state,
    billing_country: deliveryAddress.country,
    billing_email: deliveryAddress.email,
    billing_phone: deliveryAddress.phone,
    shipping_is_billing: true,
    shipping_customer_name: "",
    shipping_last_name: "",
    shipping_address: "",
    shipping_address_2: "",
    shipping_city: "",
    shipping_pincode: "",
    shipping_country: "",
    shipping_state: "",
    shipping_email: "",
    shipping_phone: "",
    order_items: orderItems,
    payment_method: "Prepaid",
    shipping_charges: 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: 0,
    sub_total: parseFloat(order.totalAmount),
    length: 10,
    breadth: 15,
    height: 20,
    weight: 2.5,
  };

  console.log("requestData", requestData);

  let response;
  try {
    response = await shiprocketAxios.post(
      "/external/orders/create/adhoc",
      requestData
    );
  } catch (error) {
    handleAxiosError(
      error,
      "SHIPROCKET",
      "Failed to create order in Shiprocket",
      ExternalServiceError
    );
  }

  if (!response || !response.data) {
    throw new ExternalServiceError(
      "No response from Shiprocket API",
      "SHIPROCKET"
    );
  }

  if (!response.data.order_id) {
    throw new ExternalServiceError(
      response.data?.message || "Failed to create order in Shiprocket",
      "SHIPROCKET",
      response.data
    );
  }

  const responseData = response.data;

  const shipmentData = {
    orderId: order.id,
    sellerId: buyerId, //TODO: remove sellerId field from model
    shiprocketOrderId: responseData.order_id?.toString() || null,
    shipmentId: responseData.shipment_id?.toString() || null,
    status: "pending",
    awbNumber: responseData.awb_code || null,
    courierId: responseData.courier_company_id || null,
    courierName: responseData.courier_name || null,
    metadata: {
      status_code: responseData.status_code || null,
      onboarding_completed_now: responseData.onboarding_completed_now || null,
      trabuwoOrderId: responseData.channel_order_id || null,
    },
  };
  const shipment = await dao.createShipment(shipmentData);
  return shipment;
};

exports.listOrders = async (options = {}) => {
  const { page = 1, limit = 10 } = options;

  const response = await shiprocketAxios.get("/external/orders", {
    params: {
      page,
      limit,
    },
  });

  if (response.data && response.data.status === 200) {
    return response.data.data;
  }

  throw new ExternalServiceError(
    response.data?.message || "Failed to list orders",
    "SHIPROCKET"
  );
};

exports.trackOrder = async (orderId) => {
  const response = await shiprocketAxios.get(
    `/external/orders/show/${orderId}`
  );

  if (response.data && response.data.status === 200) {
    const shipment = await dao.findShipmentByShiprocketOrderId(orderId);
    if (shipment) {
      await dao.updateShipment(shipment.id, {
        status: response.data.data.status,
        awbNumber: response.data.data.awb_code,
        courierId: response.data.data.courier_id,
        courierName: response.data.data.courier_name,
        estimatedDeliveryDate: response.data.data.estimated_delivery_date,
        actualDeliveryDate: response.data.data.delivery_date,
        trackingUrl: response.data.data.tracking_url,
        metadata: response.data.data,
      });
    }

    return response.data.data;
  }

  throw new ExternalServiceError(
    response.data?.message || "Failed to track order",
    "SHIPROCKET"
  );
};

exports.shipOrder = async (orderId, courierId) => {
  const response = await shiprocketAxios.post(
    `/external/orders/show/${orderId}/ship`,
    {
      courier_id: courierId,
    }
  );

  if (response.data && response.data.status === 200) {
    const shipment = await dao.findShipmentByShiprocketOrderId(orderId);
    if (shipment) {
      await dao.updateShipment(shipment.id, {
        status: "confirmed",
        courierId,
        courierName: response.data.data.courier_name,
        awbNumber: response.data.data.awb_code,
        metadata: response.data.data,
      });
    }

    return response.data.data;
  }

  throw new ExternalServiceError(
    response.data?.message || "Failed to ship order",
    "SHIPROCKET"
  );
};

exports.schedulePickup = async (orderId, pickupData) => {
  const response = await shiprocketAxios.post(
    `/external/orders/show/${orderId}/pickup`,
    pickupData
  );

  if (response.data && response.data.status === 200) {
    const shipment = await dao.findShipmentByShiprocketOrderId(orderId);
    if (shipment) {
      await dao.updateShipment(shipment.id, {
        pickupScheduledDate: pickupData.pickup_date,
        pickupScheduledSlot: pickupData.pickup_slot,
        metadata: { ...shipment.metadata, pickup: response.data.data },
      });
    }

    return response.data.data;
  }

  throw new ExternalServiceError(
    response.data?.message || "Failed to schedule pickup",
    "SHIPROCKET"
  );
};

exports.generateShipmentLabel = async (orderId) => {
  const response = await shiprocketAxios.get(
    `/external/orders/show/${orderId}/label`,
    {
      responseType: "arraybuffer",
    }
  );

  if (response.data) {
    const shipment = await dao.findShipmentByShiprocketOrderId(orderId);
    if (shipment) {
      // await dao.updateShipment(shipment.id, {
      //   labelUrl: `data:application/pdf;base64,${Buffer.from(
      //     response.data
      //   ).toString("base64")}`,
      // });
    }

    return {
      pdfBuffer: response.data,
      contentType: "application/pdf",
      filename: `shipment-label-${orderId}.pdf`,
    };
  }

  throw new ExternalServiceError(
    "Failed to generate shipment label",
    "SHIPROCKET"
  );
};

exports.createReturnOrder = async (returnId, orderItem) => {
  const { Address, Location } = require("../sellerOnboarding/model");
  const SellerOnboarding =
    require("../sellerOnboarding/model").SellerOnboarding;

  const order = orderItem.order;
  if (!order || !order.buyerAddress) {
    throw new NotFoundError("Order or buyer address not found");
  }

  const product = orderItem.productVariant.product;
  const Catalogue = require("../catalogue/model");
  const catalogue = await Catalogue.findByPk(product.catalogueId);

  if (!catalogue) {
    throw new NotFoundError("Catalogue not found");
  }

  const { User } = require("../auth/model");
  const seller = await User.findByPk(catalogue.userId);

  if (!seller) {
    throw new NotFoundError("Seller not found");
  }

  const sellerOnboarding = await SellerOnboarding.findOne({
    where: { userId: seller.id },
  });

  if (!sellerOnboarding) {
    throw new NotFoundError("Seller onboarding not found");
  }

  const sellerAddress = await Address.findOne({
    where: { sellerOnboardingId: sellerOnboarding.id },
    include: [
      {
        model: Location,
        as: "Location",
        required: true,
      },
    ],
  });

  if (!sellerAddress) {
    throw new NotFoundError("Seller address not found");
  }

  const buyerAddress = order.buyerAddress;
  const buyerLocation = await buyerAddress.getLocation();

  if (!buyerLocation) {
    throw new NotFoundError("Buyer location not found");
  }

  const buyer = order.buyer;
  const buyerPhoneNumber = buyerAddress.phoneNumber || buyer?.mobile;
  const buyerEmail = buyer?.email || order.buyer?.email;

  if (!buyerPhoneNumber) {
    throw new ValidationError(
      "Buyer phone number is required to create return shipment"
    );
  }

  const pickupAddress = {
    name: buyerAddress.name,
    phone: buyerPhoneNumber,
    address: `${buyerAddress.buildingNumber || ""} ${
      buyerAddress.street || ""
    }`.trim(),
    address_2: buyerAddress.landmark || "",
    city: buyerLocation.city,
    state: buyerLocation.state,
    country: "India",
    pin_code: buyerLocation.pincode,
    email: buyerEmail || "",
  };

  if (!pickupAddress.email) {
    throw new ValidationError(
      "Buyer email is required to create return shipment"
    );
  }

  const sellerContactName = seller?.email || "Seller";
  const sellerPhoneNumber = seller?.mobile || buyerPhoneNumber;
  const sellerEmail = seller?.email || buyerEmail || "";

  const deliveryAddress = {
    name: sellerContactName,
    phone: sellerPhoneNumber,
    address: `${sellerAddress.buildingNumber || ""} ${
      sellerAddress.street || ""
    }`.trim(),
    address_2: sellerAddress.landmark || "",
    city: sellerAddress.Location.city,
    state: sellerAddress.Location.state,
    country: "India",
    pin_code: sellerAddress.Location.pincode,
    email: sellerEmail,
  };

  if (!deliveryAddress.phone) {
    throw new ValidationError(
      "Seller phone number is required to create return shipment"
    );
  }

  if (!deliveryAddress.email) {
    throw new ValidationError(
      "Seller email is required to create return shipment"
    );
  }

  const orderDate = new Date(order.createdAt);
  const formattedDate = `${orderDate.getFullYear()}-${String(
    orderDate.getMonth() + 1
  ).padStart(2, "0")}-${String(orderDate.getDate()).padStart(2, "0")} ${String(
    orderDate.getHours()
  ).padStart(2, "0")}:${String(orderDate.getMinutes()).padStart(2, "0")}`;

  const requestData = {
    order_id: order.publicId,
    order_date: formattedDate,
    pickup_location: "Home",
    billing_customer_name: pickupAddress.name,
    billing_last_name: "",
    billing_address: pickupAddress.address,
    billing_address_2: pickupAddress.address_2,
    billing_city: pickupAddress.city,
    billing_pincode: pickupAddress.pin_code,
    billing_state: pickupAddress.state,
    billing_country: pickupAddress.country,
    billing_email: pickupAddress.email,
    billing_phone: pickupAddress.phone,
    billing_alternate_phone: "",
    shipping_is_billing: false,
    shipping_customer_name: deliveryAddress.name,
    shipping_last_name: "",
    shipping_address: deliveryAddress.address,
    shipping_address_2: deliveryAddress.address_2,
    shipping_city: deliveryAddress.city,
    shipping_pincode: deliveryAddress.pin_code,
    shipping_state: deliveryAddress.state,
    shipping_country: deliveryAddress.country,
    shipping_email: deliveryAddress.email,
    shipping_phone: deliveryAddress.phone,
    shipping_alternate_phone: "",
    order_items: [
      {
        name: product.name,
        sku: product.styleCode || `SKU-${product.id}`,
        units: orderItem.quantity,
        selling_price: orderItem.price,
        discount: 0,
        tax: 0,
        hsn: 0,
      },
    ],
    payment_method: "Prepaid",
    shipping_charges: 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: 0,
    sub_total: Number(orderItem.price) * Number(orderItem.quantity),
    length: 10,
    breadth: 10,
    height: 10,
    weight: 0.5,
  };

  const response = await shiprocketAxios.post(
    "/external/orders/create/adhoc",
    requestData
  );

  if (response.data && response.data.status === 200) {
    return {
      shiprocketReturnOrderId: response.data.data.order_id,
      returnAwbNumber: response.data.data.awb_code || null,
      returnTrackingUrl: response.data.data.tracking_url || null,
      metadata: response.data.data,
    };
  }

  throw new ExternalServiceError(
    response.data?.message || "Failed to create return order in Shiprocket",
    "SHIPROCKET"
  );
};

exports.cancelOrder = async (orderId) => {
  const response = await shiprocketAxios.post(
    `/external/orders/show/${orderId}/cancel`
  );

  if (response.data && response.data.status === 200) {
    const shipment = await dao.findShipmentByShiprocketOrderId(orderId);
    if (shipment) {
      await dao.updateShipment(shipment.id, {
        status: "cancelled",
        metadata: { ...shipment.metadata, cancellation: response.data.data },
      });
    }

    return response.data.data;
  }

  throw new ExternalServiceError(
    response.data?.message || "Failed to cancel order",
    "SHIPROCKET"
  );
};

exports.cancelOrdersByIds = async (shiprocketOrderIds) => {
  if (!Array.isArray(shiprocketOrderIds) || shiprocketOrderIds.length === 0) {
    throw new ValidationError("Shiprocket order IDs must be a non-empty array");
  }

  const ids = shiprocketOrderIds
    .map((id) => parseInt(id, 10))
    .filter((id) => !isNaN(id));

  if (ids.length === 0) {
    throw new ValidationError("Invalid Shiprocket order IDs provided");
  }

  let response;
  try {
    response = await shiprocketAxios.post("/external/orders/cancel", {
      ids: ids,
    });
  } catch (error) {
    handleAxiosError(
      error,
      "SHIPROCKET",
      "Failed to cancel orders in Shiprocket",
      ExternalServiceError
    );
  }

  if (!response || !response.data) {
    throw new ExternalServiceError(
      "No response from Shiprocket API",
      "SHIPROCKET"
    );
  }

  if (response.data.status !== 200 && response.data.status_code !== 200) {
    throw new ExternalServiceError(
      response.data?.message || "Failed to cancel orders in Shiprocket",
      "SHIPROCKET",
      response.data
    );
  }

  return response.data;
};

exports.listPickupAddresses = async () => {
  const response = await shiprocketAxios.get(
    "/external/settings/company/pickup-location"
  );

  if (response.data && response.data.status === 200) {
    return response.data.data;
  }

  throw new ExternalServiceError(
    response.data?.message || "Failed to list pickup addresses",
    "SHIPROCKET"
  );
};

exports.addPickupLocation = async (pickupLocationData) => {
  let response;
  try {
    response = await shiprocketAxios.post(
      "/external/settings/company/addpickup",
      pickupLocationData
    );
  } catch (error) {
    handleAxiosError(
      error,
      "SHIPROCKET",
      "Failed to add pickup location in Shiprocket",
      ExternalServiceError
    );
  }

  if (!response || !response.data) {
    throw new ExternalServiceError(
      "No response from Shiprocket API",
      "SHIPROCKET"
    );
  }

  if (response.data.success !== true) {
    throw new ExternalServiceError(
      response.data?.message || "Failed to add pickup location in Shiprocket",
      "SHIPROCKET",
      response.data
    );
  }

  return response.data;
};

exports.getCouriersList = async () => {
  const response = await shiprocketAxios.get("/external/courier/courierList");

  if (response.data && response.data.status === 200) {
    return response.data.data;
  }

  throw new ExternalServiceError(
    response.data?.message || "Failed to get couriers list",
    "SHIPROCKET"
  );
};

exports.getShipmentById = async (shipmentId) => {
  const shipment = await dao.getShipmentWithOrder(shipmentId);
  if (!shipment) {
    throw new NotFoundError("Shipment not found");
  }
  return shipment;
};

exports.getShipmentsBySeller = async (sellerId, options) => {
  return await dao.getShipmentsBySeller(sellerId, options);
};

exports.getAllShipments = async (options) => {
  return await dao.getAllShipments(options);
};

exports.updateShipment = async (shipmentId, data) => {
  const shipment = await dao.findShipmentById(shipmentId);
  if (!shipment) {
    throw new NotFoundError("Shipment not found");
  }

  return await dao.updateShipment(shipmentId, data);
};

exports.deleteShipment = async (shipmentId) => {
  const shipment = await dao.findShipmentById(shipmentId);
  if (!shipment) {
    throw new NotFoundError("Shipment not found");
  }

  return await dao.deleteShipment(shipmentId);
};

exports.assignAwbToShipment = async (shipmentPublicId, courierId) => {
  const shipment = await dao.findShipmentByPublicId(shipmentPublicId);
  if (!shipment) {
    throw new NotFoundError("Shipment not found");
  }

  if (!shipment.shipmentId) {
    throw new ValidationError(
      "Shipment does not have a Shiprocket shipment_id"
    );
  }

  let response;
  try {
    response = await shiprocketAxios.post("/external/courier/assign/awb", {
      shipment_id: shipment.shipmentId,
      courier_id: courierId,
    });
  } catch (error) {
    handleAxiosError(
      error,
      "SHIPROCKET",
      "Failed to assign AWB to shipment",
      ExternalServiceError
    );
  }

  if (!response || !response.data) {
    throw new ExternalServiceError(
      "No response from Shiprocket API",
      "SHIPROCKET"
    );
  }

  if (response.data.awb_assign_status !== 1) {
    throw new ExternalServiceError(
      response.data?.message || "Failed to assign AWB to shipment",
      "SHIPROCKET",
      response.data
    );
  }

  const responseData = response.data.response?.data;
  if (!responseData) {
    throw new ExternalServiceError(
      "Invalid response structure from Shiprocket API",
      "SHIPROCKET"
    );
  }

  const updateData = {
    awbNumber: responseData.awb_code || null,
    courierId: responseData.courier_company_id || null,
    courierName: responseData.courier_name || null,
    status: "confirmed",
    weight: responseData.applied_weight || null,
    pickupScheduledDate: responseData.pickup_scheduled_date
      ? new Date(responseData.pickup_scheduled_date)
      : null,
    metadata: {
      ...shipment.metadata,
      awbAssignment: {
        child_courier_name: responseData.child_courier_name || null,
        routing_code: responseData.routing_code || null,
        rto_routing_code: responseData.rto_routing_code || null,
        invoice_no: responseData.invoice_no || null,
        transporter_id: responseData.transporter_id || null,
        transporter_name: responseData.transporter_name || null,
        shipped_by: responseData.shipped_by || null,
        assigned_date_time: responseData.assigned_date_time || null,
        awb_code_status: responseData.awb_code_status || null,
        cod: responseData.cod || null,
        order_id: responseData.order_id || null,
        company_id: responseData.company_id || null,
      },
    },
  };

  await dao.updateShipment(shipment.id, updateData);

  const updatedShipment = await dao.findShipmentByPublicId(shipmentPublicId);
  return updatedShipment;
};

exports.createReturnOrder = async (orderItemPublicId) => {
  const { OrderItem } = require("../order/model");
  const { Address, Location } = require("../sellerOnboarding/model");
  const SellerOnboarding =
    require("../sellerOnboarding/model").SellerOnboarding;
  const returnDao = require("../return/dao");

  const orderItem = await OrderItem.findOne({
    where: { publicId: orderItemPublicId },
  });

  if (!orderItem) {
    throw new NotFoundError("Order item not found");
  }

  const orderItemWithDetails = await dao.getOrderItemWithFullDetailsForReturn(
    orderItem.id
  );

  if (!orderItemWithDetails) {
    throw new NotFoundError("Order item details not found");
  }

  const order = orderItemWithDetails.order;
  if (!order) {
    throw new NotFoundError("Order not found");
  }

  const shipment = order.shipment;
  if (!shipment) {
    throw new NotFoundError("Shipment not found");
  }

  if (!shipment.shiprocketOrderId) {
    throw new ValidationError("Shipment does not have a Shiprocket order ID");
  }

  const buyerAddress = order.buyerAddress;
  if (!buyerAddress || !buyerAddress.location) {
    throw new ValidationError("Buyer address with location is required");
  }

  const buyer = order.buyer;
  if (!buyer) {
    throw new ValidationError("Buyer information is required");
  }

  const product = orderItemWithDetails.productVariant?.product;
  if (!product) {
    throw new NotFoundError("Product not found");
  }

  const catalogue = product.catalogue;
  if (!catalogue) {
    throw new NotFoundError("Catalogue not found");
  }

  const seller = catalogue.seller;
  if (!seller) {
    throw new NotFoundError("Seller not found");
  }

  const sellerOnboarding = await SellerOnboarding.findOne({
    where: { userId: seller.id },
  });

  if (!sellerOnboarding) {
    throw new NotFoundError("Seller onboarding not found");
  }

  const sellerAddress = await Address.findOne({
    where: { sellerOnboardingId: sellerOnboarding.id },
    include: [
      {
        model: Location,
        as: "Location",
        required: true,
      },
    ],
  });

  if (!sellerAddress || !sellerAddress.Location) {
    throw new NotFoundError("Seller address not found");
  }

  const buyerLocation = buyerAddress.location;
  const buyerPhoneNumber = buyerAddress.phoneNumber || buyer.mobile;
  const buyerEmail = buyer.email;

  if (!buyerPhoneNumber) {
    throw new ValidationError(
      "Buyer phone number is required to create return shipment"
    );
  }

  if (!buyerEmail) {
    throw new ValidationError(
      "Buyer email is required to create return shipment"
    );
  }

  const sellerPhoneNumber = seller.mobile;
  const sellerEmail = seller.email;

  if (!sellerPhoneNumber) {
    throw new ValidationError(
      "Seller phone number is required to create return shipment"
    );
  }

  if (!sellerEmail) {
    throw new ValidationError(
      "Seller email is required to create return shipment"
    );
  }

  const pickupAddress = {
    name: buyerAddress.name,
    phone: buyerPhoneNumber,
    address: `${buyerAddress.buildingNumber || ""} ${
      buyerAddress.street || ""
    }`.trim(),
    address_2: buyerAddress.landmark || "",
    city: buyerLocation.city,
    state: buyerLocation.state,
    country: "India",
    pin_code: buyerLocation.pincode,
    email: buyerEmail,
  };

  const shippingAddress = {
    name: sellerEmail,
    phone: sellerPhoneNumber,
    address: `${sellerAddress.buildingNumber || ""} ${
      sellerAddress.street || ""
    }`.trim(),
    address_2: sellerAddress.landmark || "",
    city: sellerAddress.Location.city,
    state: sellerAddress.Location.state,
    country: "India",
    pin_code: sellerAddress.Location.pincode,
    email: sellerEmail,
  };

  const productVariant = orderItemWithDetails.productVariant;
  const sku = product.styleCode || productVariant?.skuId || `SKU-${product.id}`;

  const orderItems = [
    {
      name: product.name,
      sku: sku,
      units: orderItemWithDetails.quantity,
      selling_price: parseFloat(orderItemWithDetails.price),
      discount: 0,
      hsn: 0,
    },
  ];

  const dimensions = shipment.dimensions || {};
  const length = dimensions.length || 10;
  const breadth = dimensions.breadth || 15;
  const height = dimensions.height || 20;

  const weightInKg = product.weightInGram
    ? parseFloat(product.weightInGram) / 1000
    : 0.5;

  const requestData = {
    order_id: shipment.shiprocketOrderId,
    order_date: order.createdAt.toISOString().split("T")[0],
    pickup_customer_name: pickupAddress.name,
    pickup_last_name: "",
    pickup_address: pickupAddress.address,
    pickup_address_2: pickupAddress.address_2,
    pickup_city: pickupAddress.city,
    pickup_state: pickupAddress.state,
    pickup_country: pickupAddress.country,
    pickup_pincode: parseInt(pickupAddress.pin_code),
    pickup_email: pickupAddress.email,
    pickup_phone: pickupAddress.phone,
    pickup_isd_code: "91",
    shipping_customer_name: shippingAddress.name,
    shipping_last_name: "",
    shipping_address: shippingAddress.address,
    shipping_address_2: shippingAddress.address_2,
    shipping_city: shippingAddress.city,
    shipping_state: shippingAddress.state,
    shipping_country: shippingAddress.country,
    shipping_pincode: parseInt(shippingAddress.pin_code),
    shipping_email: shippingAddress.email,
    shipping_phone:
      shippingAddress.phone.startsWith("91") &&
      shippingAddress.phone.length > 10
        ? shippingAddress.phone.slice(2)
        : shippingAddress.phone,
    shipping_isd_code: "91",
    order_items: orderItems,
    payment_method: "Prepaid",
    total_discount: "0",
    sub_total:
      parseFloat(orderItemWithDetails.price) * orderItemWithDetails.quantity,
    length: length,
    breadth: breadth,
    height: height,
    weight: weightInKg,
  };

  let response;
  try {
    response = await shiprocketAxios.post(
      "/external/orders/create/return",
      requestData
    );
  } catch (error) {
    handleAxiosError(
      error,
      "SHIPROCKET",
      "Failed to create return order in Shiprocket",
      ExternalServiceError
    );
  }

  if (!response || !response.data) {
    throw new ExternalServiceError(
      "No response from Shiprocket API",
      "SHIPROCKET"
    );
  }

  if (!response.data.order_id) {
    throw new ExternalServiceError(
      response.data?.message || "Failed to create return order in Shiprocket",
      "SHIPROCKET",
      response.data
    );
  }

  const responseData = response.data;

  const existingReturn = await returnDao.findActiveReturnByOrderItemId(
    orderItem.id
  );

  if (existingReturn) {
    await returnDao.updateReturn(existingReturn.id, {
      shiprocketReturnOrderId: responseData.order_id?.toString() || null,
      shiprocketShipmentId: responseData.shipment_id?.toString() || null,
      status: "in_transit",
      metadata: {
        ...existingReturn.metadata,
        shiprocketReturnResponse: responseData,
      },
    });
  } else {
    await returnDao.createReturn({
      orderItemId: orderItem.id,
      status: "in_transit",
      reason: "Return initiated via Shiprocket",
      shiprocketReturnOrderId: responseData.order_id?.toString() || null,
      shiprocketShipmentId: responseData.shipment_id?.toString() || null,
      metadata: {
        shiprocketReturnResponse: responseData,
      },
    });
  }

  return responseData;
};

exports.createExchangeOrder = async (
  originalOrderItemPublicId,
  newOrderItemPublicId,
  options = {}
) => {
  const { Payment } = require("../payment/model");
  const returnDao = require("../return/dao");

  // Fetch original order item details (item being returned)
  const originalOrderItem = await dao.getOrderItemWithFullDetailsForExchange(
    originalOrderItemPublicId
  );

  if (!originalOrderItem) {
    throw new NotFoundError("Original order item not found");
  }

  // Fetch new order item details (item being exchanged to)
  const newOrderItem = await dao.getOrderItemWithFullDetailsForExchange(
    newOrderItemPublicId
  );

  if (!newOrderItem) {
    throw new NotFoundError("New order item not found");
  }

  const originalOrder = originalOrderItem.order;
  const newOrder = newOrderItem.order;
  const originalBuyer = originalOrder.buyer;

  // Validate both order items belong to same buyer
  if (originalOrder.buyerId !== newOrder.buyerId) {
    throw new ValidationError("Both order items must belong to the same buyer");
  }

  const buyerAddress = originalOrder.buyerAddress;
  if (!buyerAddress || !buyerAddress.location) {
    throw new ValidationError("Buyer address with location is required");
  }

  const buyerLocation = buyerAddress.location;
  const buyerPhoneNumber = buyerAddress.phoneNumber || originalBuyer.mobile;
  const buyerEmail = originalBuyer.email;

  if (!buyerPhoneNumber) {
    throw new ValidationError("Buyer phone number is required");
  }

  if (!buyerEmail) {
    throw new ValidationError("Buyer email is required");
  }

  // Fetch payment for original order
  const payment = await Payment.findOne({
    where: { orderId: originalOrder.id },
  });

  // Fetch return record if exists
  const returnRecord = await returnDao.findActiveReturnByOrderItemId(
    originalOrderItem.id
  );

  const originalProduct = originalOrderItem.productVariant.product;
  const newProduct = newOrderItem.productVariant.product;
  const originalProductVariant = originalOrderItem.productVariant;
  const newProductVariant = newOrderItem.productVariant;
  const originalShipment = originalOrder.shipment;

  // Split buyer name into first and last name
  const buyerNameParts = buyerAddress.name.split(" ");
  const buyerFirstName = buyerNameParts[0] || "";
  const buyerLastName = buyerNameParts.slice(1).join(" ") || "";

  // Build buyer shipping address
  const buyerShippingAddress = `${buyerAddress.buildingNumber || ""} ${
    buyerAddress.street || ""
  }`.trim();

  // Get SKU for products
  const originalSku =
    originalProductVariant.skuId ||
    originalProduct.styleCode ||
    `SKU-${originalProduct.id}`;
  const newSku =
    newProductVariant.skuId || newProduct.styleCode || `SKU-${newProduct.id}`;

  // Build request payload with comments for fields not in DB
  const requestData = {
    // NOT IN DB - Generate unique exchange order ID
    exchange_order_id: `EX_${originalOrderItem.publicId}`,

    // NOT IN DB - Must be provided as input or fetched from Shiprocket API
    seller_pickup_location_id: options.sellerPickupLocationId,

    // NOT IN DB - Must be provided as input or fetched from Shiprocket API
    seller_shipping_location_id: options.sellerShippingLocationId,

    // NOT IN DB - Generate from original order item or use Return.publicId if exists
    return_order_id: returnRecord
      ? `R_${returnRecord.publicId}`
      : `R_${originalOrderItem.publicId}`,

    // FROM DB - Order.createdAt formatted as YYYY-MM-DD
    order_date: originalOrder.createdAt.toISOString().split("T")[0],

    // FROM DB - Payment.paymentMethod or default to "prepaid"
    payment_method: payment?.paymentMethod || "prepaid",

    // FROM DB - Order.buyerAddress and Order.buyer
    buyer_shipping_first_name: buyerFirstName,
    buyer_shipping_last_name: buyerLastName,
    buyer_shipping_email: buyerEmail,
    buyer_shipping_address: buyerShippingAddress,
    buyer_shipping_address_2: buyerAddress.landmark || "",
    buyer_shipping_city: buyerLocation.city,
    buyer_shipping_state: buyerLocation.state,
    buyer_shipping_country: "India",
    buyer_shipping_pincode: buyerLocation.pincode,
    buyer_shipping_phone: buyerPhoneNumber,

    // FROM DB - Same as shipping (buyer address)
    buyer_pickup_first_name: buyerFirstName,
    buyer_pickup_last_name: buyerLastName,
    buyer_pickup_email: buyerEmail,
    buyer_pickup_address: buyerShippingAddress,
    buyer_pickup_address_2: buyerAddress.landmark || "",
    buyer_pickup_city: buyerLocation.city,
    buyer_pickup_state: buyerLocation.state,
    buyer_pickup_country: "India",
    buyer_pickup_pincode: buyerLocation.pincode,
    buyer_pickup_phone: buyerPhoneNumber,

    order_items: [
      {
        // FROM DB - New product being exchanged to
        name: newProduct.name,

        // FROM DB - New product variant price
        selling_price: newProductVariant.trabuwoPrice.toString(),

        // FROM DB - New order item quantity
        units: newOrderItem.quantity.toString(),

        // NOT IN DB - HSN code not stored, using default 0
        hsn: "0",

        // FROM DB - New product variant SKU
        sku: newSku,

        // NOT IN DB - Tax not stored separately, default to empty
        tax: "",

        // NOT IN DB - Discount not stored separately, default to empty
        discount: "",

        // NOT IN DB - Brand not stored, default to empty
        brand: "",

        // NOT IN DB - Color not stored, default to empty
        color: "",

        // NOT IN DB - Exchange item ID from Shiprocket, use shipment ID if available
        exchange_item_id: originalShipment?.shiprocketOrderId || "",

        // FROM DB - Original product being returned
        exchange_item_name: originalProduct.name,

        // FROM DB - Original product variant SKU
        exchange_item_sku: originalSku,

        // NOT IN DB - QC fields not stored, all default to empty/false
        qc_enable: false,
        qc_product_name: "",
        qc_product_image: "",
        qc_brand: "",
        qc_color: "",
        qc_size: "",
        accessories: "",
        qc_used_check: "",
        qc_sealtag_check: "",
        qc_brand_box: "",
        qc_check_damaged_product: "",
      },
    ],

    // FROM DB - Order total amount
    sub_total: originalOrder.totalAmount.toString(),

    // NOT IN DB - Shipping charges not stored, default to empty
    shipping_charges: "",

    // NOT IN DB - Gift wrap charges not stored, default to empty
    giftwrap_charges: "",

    // NOT IN DB - Total discount not stored, default to 0
    total_discount: "0",

    // NOT IN DB - Transaction charges not stored, default to empty
    transaction_charges: "",

    // NOT IN DB - Return package dimensions not stored, use provided or defaults
    return_length: options.returnDimensions?.length?.toString() || "10.00",
    return_breadth: options.returnDimensions?.breadth?.toString() || "10.00",
    return_height: options.returnDimensions?.height?.toString() || "10.00",

    // FROM DB - Original product weight converted to kg
    return_weight: (originalProduct.weightInGram / 1000).toString(),

    // NOT IN DB - Exchange package dimensions not stored, use provided or defaults
    exchange_length: options.exchangeDimensions?.length?.toString() || "11.00",
    exchange_breadth:
      options.exchangeDimensions?.breadth?.toString() || "11.00",
    exchange_height: options.exchangeDimensions?.height?.toString() || "11.00",

    // FROM DB - New product weight converted to kg
    exchange_weight: (newProduct.weightInGram / 1000).toString(),

    // FROM DB - Return reason if Return exists, otherwise use provided or default
    return_reason: returnRecord?.reason || options.returnReason || "29",

    // NOT IN DB - Channel ID not stored, default to empty
    channel_id: "",

    // NOT IN DB - Existing order ID, use Shiprocket order ID if available
    existing_order_id: originalShipment?.shiprocketOrderId || "",

    // NOT IN DB - QC check flag not stored, default to false
    qc_check: "false",
  };

  let response;
  try {
    response = await shiprocketAxios.post(
      "/external/orders/create/exchange",
      requestData
    );
  } catch (error) {
    handleAxiosError(
      error,
      "SHIPROCKET",
      "Failed to create exchange order in Shiprocket",
      ExternalServiceError
    );
  }

  if (!response || !response.data) {
    throw new ExternalServiceError(
      "No response from Shiprocket API",
      "SHIPROCKET"
    );
  }

  if (!response.data.success) {
    throw new ExternalServiceError(
      response.data?.message || "Failed to create exchange order in Shiprocket",
      "SHIPROCKET",
      response.data
    );
  }

  return response.data.data;
};

exports.createForwardShipment = async (payload) => {
  let response;
  try {
    response = await shiprocketAxios.post(
      "/external/shipments/create/forward-shipment",
      payload
    );
  } catch (error) {
    handleAxiosError(
      error,
      "SHIPROCKET",
      "Failed to create forward shipment in Shiprocket",
      ExternalServiceError
    );
  }

  if (!response || !response.data) {
    throw new ExternalServiceError(
      "No response from Shiprocket API",
      "SHIPROCKET"
    );
  }

  if (response.data.status !== 1 || !response.data.payload) {
    throw new ExternalServiceError(
      response.data?.message ||
        "Failed to create forward shipment in Shiprocket",
      "SHIPROCKET",
      response.data
    );
  }

  return response.data.payload;
};

exports.processWebhook = async (webhookPayload) => {
  if (!webhookPayload || typeof webhookPayload !== "object") {
    logger.error("Invalid webhook payload", { webhookPayload });
    return {
      processed: true,
      message: "Invalid webhook payload",
    };
  }

  const { awb, order_id, scans = [] } = webhookPayload;

  if (!awb && !order_id) {
    logger.error("Either awb or order_id is required in webhook payload", {
      awb,
      order_id,
    });
    return {
      processed: true,
      message: "Either awb or order_id is required in webhook payload",
    };
  }

  const awbString = awb != null ? String(awb) : null;
  const orderIdString = order_id != null ? String(order_id) : null;

  const shipment = await dao.findShipmentByAwbNumberOrShiprocketOrderId(
    awbString,
    orderIdString
  );

  if (!shipment) {
    logger.warn("Webhook received for unknown shipment", {
      awb,
      order_id,
    });
    return {
      processed: true,
      message: "Shipment not found",
    };
  }

  const webhookData = {
    current_status: webhookPayload.current_status || null,
    current_status_id: webhookPayload.current_status_id || null,
    shipment_status: webhookPayload.shipment_status || null,
    shipment_status_id: webhookPayload.shipment_status_id || null,
    current_timestamp: webhookPayload.current_timestamp || null,
    etd: webhookPayload.etd || null,
    channel_order_id: webhookPayload.channel_order_id || null,
    channel: webhookPayload.channel || null,
    awb: webhookPayload.awb || null,
    courier_name: webhookPayload.courier_name || null,
    order_id: webhookPayload.order_id || null,
    metadata: webhookPayload,
  };

  const scansData = Array.isArray(scans) ? scans : [];

  const updatedShipment = await dao.processWebhookData(
    shipment.id,
    webhookData,
    scansData
  );

  return {
    processed: true,
    shipment: updatedShipment,
  };
};
