import { Express } from "express";
import { storage } from "./storage";
import { InsertOrder } from "@shared/schema";
import { logger } from "./logger";
import fetch from "node-fetch";

/**
 * Setting up Shopify webhook handlers
 * 
 * Shopify webhooks include:
 * - orders/create: When a new order is created
 * - orders/updated: When an order is updated
 * - orders/cancelled: When an order is cancelled
 */
export function setupShopifyWebhooks(app: Express, authenticateJWT: any) {
  // Handle Shopify order creation webhook
  app.post("/api/webhooks/shopify/orders/create", async (req, res) => {
    try {
      const { shop, order } = req.body;
      logger.info("Received new order from Shopify", { shop, orderId: order.id });

      // Find the user by Shopify domain
      const user = Array.from((await storage.getAllUsers())).find(
        (u) => u.shopifyDomain === shop
      );

      if (!user) {
        logger.error("No matching user found for Shopify domain", { shop });
        return res.status(404).json({ message: "No matching user found for this shop" });
      }

      // Check if order already exists
      const existingOrder = await storage.getOrderByShopifyId(order.id);
      if (existingOrder) {
        logger.warn("Order already exists in system", { shop, orderId: order.id });
        return res.status(200).json({ message: "Order already processed" });
      }

      // Extract order data
      const shippingAddress = order.shipping_address 
        ? `${order.shipping_address.address1}, ${order.shipping_address.city}, ${order.shipping_address.province}, ${order.shipping_address.zip}, ${order.shipping_address.country}`
        : "No shipping address provided";

      const newOrder: InsertOrder = {
        shopifyOrderId: order.id,
        userId: user.id,
        customerName: order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : "Guest",
        customerEmail: order.customer ? order.customer.email : "",
        customerPhone: order.customer ? order.customer.phone : "",
        shippingAddress,
        orderTotal: order.total_price,
        deliveryService: user.preferredDeliveryService || "uberdirect",
      };

      // Create order in our system
      const createdOrder = await storage.createOrder(newOrder);
      logger.info("Order created successfully", { orderId: createdOrder.id, shopifyOrderId: order.id });

      // Return success
      res.status(201).json({ message: "Order received", orderId: createdOrder.id });
    } catch (error) {
      logger.error("Error processing Shopify order webhook", { error });
      res.status(500).json({ message: "Error processing order" });
    }
  });

  // Handle Shopify order update webhook
  app.post("/api/webhooks/shopify/orders/updated", async (req, res) => {
    try {
      const { shop, order } = req.body;
      logger.info("Received updated order from Shopify", { shop, orderId: order.id });

      // Find the existing order
      const existingOrder = await storage.getOrderByShopifyId(order.id);
      if (!existingOrder) {
        logger.warn("Order not found for update", { shop, orderId: order.id });
        return res.status(404).json({ message: "Order not found" });
      }

      // Update fields that may have changed
      const updatedOrder = { 
        ...existingOrder,
        customerName: order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : existingOrder.customerName,
        customerEmail: order.customer ? order.customer.email : existingOrder.customerEmail,
        customerPhone: order.customer ? order.customer.phone : existingOrder.customerPhone,
        orderTotal: order.total_price || existingOrder.orderTotal,
      };

      // Update order in our system
      await storage.updateOrder(existingOrder.id, updatedOrder);
      logger.info("Order updated successfully", { orderId: existingOrder.id });

      res.status(200).json({ message: "Order updated" });
    } catch (error) {
      logger.error("Error processing Shopify order update webhook", { error });
      res.status(500).json({ message: "Error updating order" });
    }
  });

  // Handle Shopify order cancellation webhook
  app.post("/api/webhooks/shopify/orders/cancelled", async (req, res) => {
    try {
      const { shop, order } = req.body;
      logger.info("Received cancelled order from Shopify", { shop, orderId: order.id });

      // Find the existing order
      const existingOrder = await storage.getOrderByShopifyId(order.id);
      if (!existingOrder) {
        logger.warn("Order not found for cancellation", { shop, orderId: order.id });
        return res.status(404).json({ message: "Order not found" });
      }

      // Update the order status
      await storage.updateOrder(existingOrder.id, { status: "cancelled" });
      logger.info("Order cancelled successfully", { orderId: existingOrder.id });

      res.status(200).json({ message: "Order cancelled" });
    } catch (error) {
      logger.error("Error processing Shopify order cancellation webhook", { error });
      res.status(500).json({ message: "Error cancelling order" });
    }
  });

  // API to manually register Shopify webhooks for a user
  app.post("/api/setup-shopify-webhooks", authenticateJWT, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.shopifyDomain || !user.shopifyApiKey || !user.shopifyApiSecret) {
        return res.status(400).json({ message: "Shopify credentials not set" });
      }
      
      // Setup webhooks via Shopify API
      const webhooks = [
        { topic: "orders/create", address: `${process.env.APP_URL || 'https://example.com'}/api/webhooks/shopify/orders/create` },
        { topic: "orders/updated", address: `${process.env.APP_URL || 'https://example.com'}/api/webhooks/shopify/orders/updated` },
        { topic: "orders/cancelled", address: `${process.env.APP_URL || 'https://example.com'}/api/webhooks/shopify/orders/cancelled` },
      ];
      
      for (const webhook of webhooks) {
        try {
          const response = await fetch(`https://${user.shopifyDomain}/admin/api/2023-07/webhooks.json`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': user.shopifyApiSecret
            },
            body: JSON.stringify({ webhook })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            logger.warn("Failed to create Shopify webhook", { 
              userId,
              topic: webhook.topic,
              error: errorData
            });
          }
        } catch (error) {
          logger.error("Error creating Shopify webhook", { error, userId, topic: webhook.topic });
        }
      }
      
      res.status(200).json({ message: "Webhooks setup initiated" });
    } catch (error) {
      logger.error("Error setting up Shopify webhooks", { error, userId: req.user.userId });
      res.status(500).json({ message: "Error setting up webhooks" });
    }
  });

  // Update Shopify with delivery status
  app.post("/api/shopify/update-fulfillment", authenticateJWT, async (req: any, res) => {
    try {
      const { orderId, status, trackingInfo } = req.body;
      
      const order = await storage.getOrder(parseInt(orderId));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Ensure user has access to this order
      if (!req.user.isAdmin && order.userId !== req.user.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get user (store owner) details
      const user = await storage.getUser(order.userId);
      if (!user || !user.shopifyDomain || !user.shopifyApiSecret) {
        return res.status(400).json({ message: "Shopify credentials not available" });
      }
      
      // Map our status to Shopify fulfillment status
      let fulfillmentStatus;
      switch (status) {
        case "in_transit":
          fulfillmentStatus = "in_transit";
          break;
        case "delivered":
          fulfillmentStatus = "success";
          break;
        case "failed":
          fulfillmentStatus = "failure";
          break;
        default:
          fulfillmentStatus = null;
      }
      
      if (fulfillmentStatus) {
        // Update Shopify via API
        try {
          // First, we need to get the fulfillment ID if it exists
          const response = await fetch(`https://${user.shopifyDomain}/admin/api/2023-07/orders/${order.shopifyOrderId}/fulfillments.json`, {
            headers: {
              'X-Shopify-Access-Token': user.shopifyApiSecret
            }
          });
          
          if (!response.ok) {
            logger.error("Error getting fulfillments from Shopify", { orderId, shopifyOrderId: order.shopifyOrderId });
            return res.status(500).json({ message: "Error updating Shopify" });
          }
          
          const fulfillmentData = await response.json();
          
          if (fulfillmentData.fulfillments && fulfillmentData.fulfillments.length > 0) {
            // Update existing fulfillment
            const fulfillmentId = fulfillmentData.fulfillments[0].id;
            
            const updateResponse = await fetch(`https://${user.shopifyDomain}/admin/api/2023-07/fulfillments/${fulfillmentId}/update_tracking.json`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': user.shopifyApiSecret
              },
              body: JSON.stringify({
                fulfillment: {
                  tracking_info: {
                    number: trackingInfo?.trackingNumber || order.deliveryOrderId,
                    url: trackingInfo?.trackingUrl || order.deliveryTrackingUrl,
                    company: order.deliveryService
                  }
                }
              })
            });
            
            if (!updateResponse.ok) {
              logger.error("Error updating fulfillment in Shopify", { 
                orderId, 
                shopifyOrderId: order.shopifyOrderId,
                fulfillmentId
              });
              return res.status(500).json({ message: "Error updating Shopify" });
            }
          } else {
            // Create new fulfillment
            const createResponse = await fetch(`https://${user.shopifyDomain}/admin/api/2023-07/orders/${order.shopifyOrderId}/fulfillments.json`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': user.shopifyApiSecret
              },
              body: JSON.stringify({
                fulfillment: {
                  location_id: 'all',
                  tracking_number: trackingInfo?.trackingNumber || order.deliveryOrderId,
                  tracking_url: trackingInfo?.trackingUrl || order.deliveryTrackingUrl,
                  tracking_company: order.deliveryService,
                  status: fulfillmentStatus
                }
              })
            });
            
            if (!createResponse.ok) {
              logger.error("Error creating fulfillment in Shopify", { orderId, shopifyOrderId: order.shopifyOrderId });
              return res.status(500).json({ message: "Error updating Shopify" });
            }
          }
          
          logger.info("Successfully updated Shopify with fulfillment status", { 
            orderId, 
            shopifyOrderId: order.shopifyOrderId,
            status: fulfillmentStatus
          });
          
          res.status(200).json({ message: "Shopify updated successfully" });
        } catch (error) {
          logger.error("Error communicating with Shopify API", { error, orderId });
          res.status(500).json({ message: "Error updating Shopify" });
        }
      } else {
        res.status(400).json({ message: "Invalid status for Shopify update" });
      }
    } catch (error) {
      logger.error("Error in Shopify fulfillment update", { error });
      res.status(500).json({ message: "Error updating fulfillment" });
    }
  });
}
