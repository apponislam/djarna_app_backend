import express from "express";
import auth from "../../middlewares/auth";
import { messageControllers } from "./messages.controllers";
import { uploadMessageFiles } from "../../middlewares/multer";

const router = express.Router();

// All routes require authentication
router.use(auth);

// Conversation management
router.post("/conversations", messageControllers.createConversation);
router.get("/conversations", messageControllers.getUserConversations);
router.get("/conversations/:conversationId", messageControllers.getConversationById);
router.post("/conversations/:conversationId/read", messageControllers.markAsRead);
router.delete("/conversations/:conversationId", messageControllers.deleteConversation);

// Message management
router.get("/conversations/:conversationId/messages", messageControllers.getMessages);
router.post("/send", uploadMessageFiles, messageControllers.sendMessage);

// Offer management
router.post("/:messageId/accept", messageControllers.acceptOffer);
router.post("/:messageId/reject", messageControllers.rejectOffer);

// Message editing/deletion
router.patch("/:messageId", messageControllers.editMessage);
router.delete("/:messageId", messageControllers.deleteMessage);

export const messageRoutes = router;
