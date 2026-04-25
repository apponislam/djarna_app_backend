import { Router } from "express";
import auth from "../../middlewares/auth";
import { ShippingAddressController } from "./address.controllers";

const router = Router();

router.post("/", auth, ShippingAddressController.addAddress);
router.get("/", auth, ShippingAddressController.getMyAddresses);
router.patch("/:id", auth, ShippingAddressController.updateAddress);
router.delete("/:id", auth, ShippingAddressController.deleteAddress);
router.patch("/:id/set-default", auth, ShippingAddressController.setDefaultAddress);

export const ShippingAddressRoutes = router;
