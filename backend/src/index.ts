import express from "express";
import uploadRoutes from "./routes/uploadRoutes";
import jobRoutes from "./routes/jobRoutes";

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(uploadRoutes);
app.use(jobRoutes);
app.get("/health", (req, res) => {res.json("hello world")})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
