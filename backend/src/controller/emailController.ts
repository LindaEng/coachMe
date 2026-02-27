import {Request, Response} from "express";
import { sendEmail } from "../services/emailService";

export async function sendEmailController(req: Request, res: Response) {
    const { to, subject, body } = req.body;

    if(!to || !subject || !body) {
        return res.status(400).json({
            error: "Missing required fields: to, subject, body"
        });
    }
    try {
        await sendEmail(to, subject, body);
        res.status(200).json({ message: "email sent!"})
    } catch (error) {
        console.error("Email send failed ", error);
        res.status(500).json({ error: "Email Failed "})
    }
}