import { Express } from "express";
import { storage } from "./storage";
import { logger } from "./logger";
import fetch from "node-fetch";

// Utility function for retrying API requests
async function retryRequest(
  requestFn: () => Promise<Response>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<Response> {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await requestFn();
      if (response.ok) {
        return response;
      }
      
      lastError = new Error(`Request failed with status ${response.status}`);
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Wait before the next retry
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    } catch (error) {
      lastError = error;
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before the next retry
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
}

export function setupDeliveryRoutes(app: Express, authenticateJWT: any) {
  // Submit order to a delivery service
  app.post("/api/delivery/submit", authenticateJWT, async (req: any, res) => {
    try {
      const { orderId, service } = req.body;
      
      if (!orderId || !service) {
        return res.status(400).json({ message: "Order ID and delivery service are required" });
      }
      
      const order = await storage.getOrder(parseInt(orderId));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Ensure user has access to this order
      if (!req.user.isAdmin && order.userId !== req.user.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Check if order is already submitted to a delivery service
      if (order.deliveryOrderId) {
        return res.status(400).json({ 
          message: "Order already submitted to delivery service",
          deliveryOrderId: order.deliveryOrderId,
          deliveryService: order.deliveryService
        });
      }
      
      let deliveryResult;
      
      // Submit to the appropriate delivery service
      switch (service.toLowerCase()) {
        case "uberdirect":
          deliveryResult = await submitToUberDirect(order);
          break;
        case "jetgo":
          deliveryResult = await submitToJetGo(order);
          break;
        default:
          return res.status(400).json({ message: "Unsupported delivery service" });
      }
      
      // Update the order with delivery information
      const updatedOrder = await storage.updateOrder(order.id, {
        deliveryService: service.toLowerCase(),
        deliveryOrderId: deliveryResult.orderId,
        deliveryTrackingUrl: deliveryResult.trackingUrl,
        status: "in_transit",
        deliveryData: deliveryResult.data
      });
      
      // Update Shopify with tracking information
      try {
        await fetch(`${process.env.APP_URL || 'http://localhost:5000'}/api/shopify/update-fulfillment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`
          },
          body: JSON.stringify({
            orderId: order.id,
            status: "in_transit",
            trackingInfo: {
              trackingNumber: deliveryResult.orderId,
              trackingUrl: deliveryResult.trackingUrl
            }
          })
        });
      } catch (error) {
        logger.warn("Failed to update Shopify with tracking information", { error, orderId: order.id });
      }
      
      res.status(200).json({
        message: "Order submitted successfully",
        order: updatedOrder
      });
    } catch (error) {
      logger.error("Error submitting to delivery service", { error, orderId: req.body.orderId });
      res.status(500).json({ message: "Error submitting to delivery service" });
    }
  });

  // Check delivery status
  app.get("/api/delivery/status/:orderId", authenticateJWT, async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Ensure user has access to this order
      if (!req.user.isAdmin && order.userId !== req.user.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (!order.deliveryOrderId || !order.deliveryService) {
        return res.status(400).json({ message: "Order not submitted to delivery service yet" });
      }
      
      let statusResult;
      
      // Check status with the appropriate delivery service
      switch (order.deliveryService.toLowerCase()) {
        case "uberdirect":
          statusResult = await checkUberDirectStatus(order.deliveryOrderId);
          break;
        case "jetgo":
          statusResult = await checkJetGoStatus(order.deliveryOrderId);
          break;
        default:
          return res.status(400).json({ message: "Unsupported delivery service" });
      }
      
      // Update order status if it has changed
      if (statusResult.status !== order.status) {
        const updatedOrder = await storage.updateOrder(order.id, {
          status: statusResult.status,
          deliveryData: { ...order.deliveryData, ...statusResult.data }
        });
        
        // If the order was delivered or failed, update Shopify
        if (["delivered", "failed"].includes(statusResult.status)) {
          try {
            await fetch(`${process.env.APP_URL || 'http://localhost:5000'}/api/shopify/update-fulfillment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`
              },
              body: JSON.stringify({
                orderId: order.id,
                status: statusResult.status
              })
            });
          } catch (error) {
            logger.warn("Failed to update Shopify with final status", { error, orderId: order.id });
          }
        }
        
        return res.status(200).json({
          message: "Status updated",
          previousStatus: order.status,
          currentStatus: statusResult.status,
          order: updatedOrder
        });
      }
      
      res.status(200).json({
        message: "Status unchanged",
        status: order.status,
        deliveryData: order.deliveryData
      });
    } catch (error) {
      logger.error("Error checking delivery status", { error, orderId: req.params.orderId });
      res.status(500).json({ message: "Error checking delivery status" });
    }
  });

  // Handle webhook from UberDirect
  app.post("/api/webhooks/uberdirect", async (req, res) => {
    try {
      const { delivery_id, status, tracking_url, timestamp } = req.body;
      
      if (!delivery_id) {
        return res.status(400).json({ message: "Delivery ID is required" });
      }
      
      // Find the order by delivery ID
      const orders = await storage.getAllOrders();
      const order = orders.find(o => o.deliveryOrderId === delivery_id);
      
      if (!order) {
        logger.warn("UberDirect webhook: Order not found for delivery ID", { delivery_id });
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Map UberDirect status to our status
      let orderStatus;
      switch (status) {
        case "picked_up":
        case "in_transit":
          orderStatus = "in_transit";
          break;
        case "delivered":
          orderStatus = "delivered";
          break;
        case "cancelled":
        case "failed":
          orderStatus = "failed";
          break;
        default:
          orderStatus = order.status;
      }
      
      // Update order status
      if (orderStatus !== order.status) {
        await storage.updateOrder(order.id, {
          status: orderStatus,
          deliveryTrackingUrl: tracking_url || order.deliveryTrackingUrl,
          deliveryData: {
            ...order.deliveryData,
            lastUpdateTimestamp: timestamp,
            currentStatus: status
          }
        });
        
        // Update Shopify if status is final
        if (["delivered", "failed"].includes(orderStatus)) {
          try {
            // Use an admin JWT to call the Shopify update endpoint
            const adminToken = generateAdminJWT();
            
            await fetch(`${process.env.APP_URL || 'http://localhost:5000'}/api/shopify/update-fulfillment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
              },
              body: JSON.stringify({
                orderId: order.id,
                status: orderStatus
              })
            });
          } catch (error) {
            logger.warn("Failed to update Shopify from UberDirect webhook", { error, orderId: order.id });
          }
        }
        
        logger.info("UberDirect webhook: Updated order status", { 
          orderId: order.id, 
          deliveryId: delivery_id, 
          previousStatus: order.status, 
          newStatus: orderStatus 
        });
      }
      
      res.status(200).json({ message: "Webhook processed successfully" });
    } catch (error) {
      logger.error("Error processing UberDirect webhook", { error });
      res.status(500).json({ message: "Error processing webhook" });
    }
  });
  
  // Handle webhook from JetGo
  app.post("/api/webhooks/jetgo", async (req, res) => {
    try {
      const { order_id, status, tracking, update_time } = req.body;
      
      if (!order_id) {
        return res.status(400).json({ message: "Order ID is required" });
      }
      
      // Find the order by delivery ID
      const orders = await storage.getAllOrders();
      const order = orders.find(o => o.deliveryOrderId === order_id);
      
      if (!order) {
        logger.warn("JetGo webhook: Order not found for order ID", { order_id });
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Map JetGo status to our status
      let orderStatus;
      switch (status) {
        case "out_for_delivery":
        case "in_transit":
          orderStatus = "in_transit";
          break;
        case "delivered":
          orderStatus = "delivered";
          break;
        case "cancelled":
        case "failed":
        case "returned":
          orderStatus = "failed";
          break;
        default:
          orderStatus = order.status;
      }
      
      // Update order status
      if (orderStatus !== order.status) {
        await storage.updateOrder(order.id, {
          status: orderStatus,
          deliveryTrackingUrl: tracking?.url || order.deliveryTrackingUrl,
          deliveryData: {
            ...order.deliveryData,
            lastUpdateTimestamp: update_time,
            currentStatus: status,
            trackingNumber: tracking?.number || order.deliveryData?.trackingNumber
          }
        });
        
        // Update Shopify if status is final
        if (["delivered", "failed"].includes(orderStatus)) {
          try {
            // Use an admin JWT to call the Shopify update endpoint
            const adminToken = generateAdminJWT();
            
            await fetch(`${process.env.APP_URL || 'http://localhost:5000'}/api/shopify/update-fulfillment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
              },
              body: JSON.stringify({
                orderId: order.id,
                status: orderStatus
              })
            });
          } catch (error) {
            logger.warn("Failed to update Shopify from JetGo webhook", { error, orderId: order.id });
          }
        }
        
        logger.info("JetGo webhook: Updated order status", { 
          orderId: order.id, 
          deliveryId: order_id, 
          previousStatus: order.status, 
          newStatus: orderStatus 
        });
      }
      
      res.status(200).json({ message: "Webhook processed successfully" });
    } catch (error) {
      logger.error("Error processing JetGo webhook", { error });
      res.status(500).json({ message: "Error processing webhook" });
    }
  });
}

// Helper function to generate an admin JWT for internal requests
function generateAdminJWT() {
  // In a real implementation, this would use the same JWT_SECRET
  // and properly sign a token with admin privileges
  return "admin-token";
}

// UberDirect API integration
async function submitToUberDirect(order: any) {
  const API_KEY = process.env.UBER_DIRECT_API_KEY || "test_key";
  const API_URL = process.env.UBER_DIRECT_API_URL || "https://api.example.com/uberdirect";
  
  logger.info("Submitting order to UberDirect", { orderId: order.id });
  
  try {
    // Format payload for UberDirect API
    const payload = {
      external_id: `order_${order.id}`,
      customer: {
        name: order.customerName,
        phone: order.customerPhone,
        email: order.customerEmail
      },
      pickup: {
        address: "Warehouse Address", // This would come from user settings
        instructions: `Order #${order.shopifyOrderId}`
      },
      dropoff: {
        address: order.shippingAddress,
        instructions: "Please deliver to customer"
      },
      items: [
        {
          name: `Order #${order.shopifyOrderId}`,
          quantity: 1,
          price: parseFloat(order.orderTotal) || 0
        }
      ]
    };
    
    // Make API request with retry logic
    const response = await retryRequest(
      () => fetch(`${API_URL}/deliveries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(payload)
      })
    );
    
    const data = await response.json();
    
    // In a real implementation, we'd parse the actual response
    // For this demo, simulate a successful response
    return {
      orderId: data.id || `ud_${Date.now()}`,
      trackingUrl: data.tracking_url || `https://track.example.com/uber/${Date.now()}`,
      data: data
    };
  } catch (error) {
    logger.error("Error submitting to UberDirect", { error, orderId: order.id });
    throw new Error("Failed to submit order to UberDirect");
  }
}

// JetGo API integration
async function submitToJetGo(order: any) {
  const API_KEY = process.env.JETGO_API_KEY || "test_key";
  const API_URL = process.env.JETGO_API_URL || "https://api.example.com/jetgo";
  
  logger.info("Submitting order to JetGo", { orderId: order.id });
  
  try {
    // Format payload for JetGo API
    const payload = {
      reference_id: `order_${order.id}`,
      recipient: {
        name: order.customerName,
        phone: order.customerPhone,
        email: order.customerEmail
      },
      origin: {
        address: "Warehouse Address", // This would come from user settings
        notes: `Order #${order.shopifyOrderId}`
      },
      destination: {
        address: order.shippingAddress,
        notes: "Please deliver to customer"
      },
      package: {
        description: `Order #${order.shopifyOrderId}`,
        value: parseFloat(order.orderTotal) || 0
      }
    };
    
    // Make API request with retry logic
    const response = await retryRequest(
      () => fetch(`${API_URL}/deliveries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify(payload)
      })
    );
    
    const data = await response.json();
    
    // In a real implementation, we'd parse the actual response
    // For this demo, simulate a successful response
    return {
      orderId: data.id || `jg_${Date.now()}`,
      trackingUrl: data.tracking_url || `https://track.example.com/jetgo/${Date.now()}`,
      data: data
    };
  } catch (error) {
    logger.error("Error submitting to JetGo", { error, orderId: order.id });
    throw new Error("Failed to submit order to JetGo");
  }
}

// Check UberDirect order status
async function checkUberDirectStatus(deliveryId: string) {
  const API_KEY = process.env.UBER_DIRECT_API_KEY || "test_key";
  const API_URL = process.env.UBER_DIRECT_API_URL || "https://api.example.com/uberdirect";
  
  logger.info("Checking UberDirect delivery status", { deliveryId });
  
  try {
    // Make API request with retry logic
    const response = await retryRequest(
      () => fetch(`${API_URL}/deliveries/${deliveryId}`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      })
    );
    
    const data = await response.json();
    
    // Map UberDirect status to our status
    let status;
    switch (data.status) {
      case "picked_up":
      case "in_transit":
        status = "in_transit";
        break;
      case "delivered":
        status = "delivered";
        break;
      case "cancelled":
      case "failed":
        status = "failed";
        break;
      default:
        status = "processing";
    }
    
    return { status, data };
  } catch (error) {
    logger.error("Error checking UberDirect status", { error, deliveryId });
    throw new Error("Failed to check delivery status");
  }
}

// Check JetGo order status
async function checkJetGoStatus(orderId: string) {
  const API_KEY = process.env.JETGO_API_KEY || "test_key";
  const API_URL = process.env.JETGO_API_URL || "https://api.example.com/jetgo";
  
  logger.info("Checking JetGo delivery status", { orderId });
  
  try {
    // Make API request with retry logic
    const response = await retryRequest(
      () => fetch(`${API_URL}/deliveries/${orderId}`, {
        headers: {
          'X-API-Key': API_KEY
        }
      })
    );
    
    const data = await response.json();
    
    // Map JetGo status to our status
    let status;
    switch (data.status) {
      case "out_for_delivery":
      case "in_transit":
        status = "in_transit";
        break;
      case "delivered":
        status = "delivered";
        break;
      case "cancelled":
      case "failed":
      case "returned":
        status = "failed";
        break;
      default:
        status = "processing";
    }
    
    return { status, data };
  } catch (error) {
    logger.error("Error checking JetGo status", { error, orderId });
    throw new Error("Failed to check delivery status");
  }
}
