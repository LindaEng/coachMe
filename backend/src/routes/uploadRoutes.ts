import { Router } from "express";
import { initUpload } from "../controller/uploadController"; 

const router = Router();

router.post("/upload/init", initUpload);

export default router;
