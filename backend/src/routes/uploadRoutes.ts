import { Router } from "express";
import { initUpload, completeUpload } from "../controller/uploadController";

const router = Router();

router.post("/upload/init", initUpload);
router.post("/upload/complete", completeUpload);

export default router;
