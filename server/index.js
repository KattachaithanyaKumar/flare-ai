import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import sequelize from "./config/database.js";
import userRouter from "./routes/UserRoute.js";

const PORT = process.env.PORT ?? 3000;

const app = express();

app.use(cors());
app.use(express.json());
dotenv.config();

app.get("/", (req, res) => {
  res.send("Hello world");
});

// routes
app.use("/api", userRouter);

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log("Database connected");

    app.listen(PORT, () => {
      console.log(`server started with http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
};

start();
