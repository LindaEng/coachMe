import express from "express";

const app = express();
const PORT = 3001;

app.get("/heath", (req, res) => {
    res.json({status: "ok"})
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})