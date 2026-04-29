import { Server, Socket } from "socket.io";
import http from "http";

let io: Server;

/*
|--------------------------------------------------------------------------
| Initialize Socket Server
|--------------------------------------------------------------------------
*/

export const initSocket = (server: http.Server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
        pingTimeout: 60000,
    });

    io.on("connection", (socket: Socket) => {
        console.log("🔌 Socket connected:", socket.id);

        const userId = socket.handshake.auth?._id;
        const role = socket.handshake.auth?.role;

        if (userId) {
            socket.join(`user_${userId}`);
            console.log("User joined room:", userId);

            if (role === "ADMIN") {
                socket.join("admin_room");
                console.log("Admin joined admin_room:", userId);
            }
        }

        /*
        ------------------------------------------------
        Register Global Events Here
        ------------------------------------------------
        */

        socket.on("ping", () => {
            socket.emit("pong", "pong");
        });

        socket.on("disconnect", () => {
            console.log("❌ Socket disconnected:", socket.id);
        });
    });

    return io;
};

/*
|--------------------------------------------------------------------------
| Get Socket Instance Anywhere
|--------------------------------------------------------------------------
*/

export const getSocket = () => {
    if (!io) {
        throw new Error("Socket not initialized");
    }

    return io;
};

/*
|--------------------------------------------------------------------------
| New Socket Helpers (Exported at the bottom)
|--------------------------------------------------------------------------
*/

/**
 * Emit event to a specific user's room
 */
export const emitToUser = (userId: string, event: string, data: any) => {
    if (!io) return;
    io.to(`user_${userId}`).emit(event, data);
};

/**
 * Emit event to all admins
 */
export const emitToAdmin = (event: string, data: any) => {
    if (!io) return;
    io.to("admin_room").emit(event, data);
};
