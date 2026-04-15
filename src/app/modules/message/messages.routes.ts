import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { messageControllers } from "./messages.controllers";

const router = express.Router();

// Get user's conversations
router.get("/", auth, messageControllers.getMyConversations);

// Send a message
router.post("/send", auth, messageControllers.sendMessage);

// Send an offer
router.post("/send-offer", auth, messageControllers.sendOffer);

// Share location
router.post("/share-location", auth, messageControllers.shareLocation);

// Update offer status (Accepted/Rejected/Completed)
router.post("/update-offer-status", auth, messageControllers.updateOfferStatus);

// Get messages for a specific conversation
router.get("/:conversationId", auth, messageControllers.getMessages);

// Delete a conversation for the user
router.delete("/conversation/:conversationId", auth, messageControllers.deleteConversation);

// Delete a specific message for the user
router.delete("/message/:messageId", auth, messageControllers.deleteMessage);

export const messageRoutes = router;
