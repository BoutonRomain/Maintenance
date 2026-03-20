import express, { Application, Request, Response } from "express";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import sequelize from "./config/database";
import cors from "cors";

import "./models/associations";

import { RegisterRoutes } from "./routes/index";
import errorHandler from "./middlewares/errorHandler";

const PORT = process.env.PORT || 8000;

const app: Application = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(morgan("tiny"));
app.use(express.static("public"));

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "API is running!", timestamp: new Date().toISOString() });
});

RegisterRoutes(app);

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    swaggerOptions: {
      url: "/swagger.json",
    },
  })
);

app.use(errorHandler);

app.listen(PORT, async () => {
  console.log("Server is running on port", PORT);

  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    await sequelize.sync();
    console.log("Database synchronized successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
});
