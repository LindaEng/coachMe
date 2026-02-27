import express from "express";
import cors from "cors";
import uploadRoutes from "./routes/uploadRoutes";
import jobRoutes from "./routes/jobRoutes";
import emailRoutes from "./routes/emailRoutes";

const app = express();
const PORT = 3001;

app.use(cors({
  origin: "http://localhost:5173"
}))
app.use(express.json());
app.use(uploadRoutes);
app.use(jobRoutes);
app.use(emailRoutes);
app.get("/health", (req, res) => {res.json("hello world")})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
