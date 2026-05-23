import { JwtPayload } from "jsonwebtoken";

declare global {
    namespace Express {
        interface User {
            _id: string;
            name: string;
            phone: string;
            role: string;
        }

        interface Request {
            user: JwtPayload & {
                _id: string;
                name: string;
                phone: string;
                role: string;
            };
            authUser?: any;
        }
    }
}
