import express from "express";
import auth from "../../middlewares/auth";
import { messageControllers } from "./messages.controllers";
import { uploadMessageFiles } from "../../middlewares/multer";

const router = express.Router();

// All routes require authentication

// Conversation management
router.post("/conversations", auth, messageControllers.createConversation);
router.get("/conversations", auth, messageControllers.getUserConversations);
router.get("/conversations/:conversationId", auth, messageControllers.getConversationById);
router.post("/conversations/:conversationId/read", auth, messageControllers.markAsRead);
router.delete("/conversations/:conversationId", auth, messageControllers.deleteConversation);

// Message management
router.get("/conversations/:conversationId/messages", auth, messageControllers.getMessages);
router.post("/send", auth, uploadMessageFiles, messageControllers.sendMessage);

// Offer management
router.post("/:messageId/accept", auth, messageControllers.acceptOffer);
router.post("/:messageId/reject", auth, messageControllers.rejectOffer);

// Message editing/deletion
router.patch("/:messageId", auth, messageControllers.editMessage);
router.delete("/:messageId", auth, messageControllers.deleteMessage);

export const messageRoutes = router;
