import express from "express";
import uploadRoutes from "./routes/uploadRoutes";

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(uploadRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
