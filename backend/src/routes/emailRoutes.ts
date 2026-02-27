import { Router } from "express";
import { sendEmailController } from "../controller/emailController";

const router = Router();

router.post("/send", sendEmailController);

export default router;