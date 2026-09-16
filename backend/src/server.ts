import "dotenv/config";
import express from "express";
import cors from "cors";
import accountRouter from "./routes/account.routes.js";
import categoryRouter from "./routes/category.routes.js";
import transactionRouter from "./routes/transaction.routes.js";
import budgetRouter from "./routes/budget.routes.js";
import dashboardRouter from "./routes/dashborad.routes.js"
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import authRouter from "./routes/auth.routes.js";
import { checkOrigin, requireAuth } from "./lib/auth.js";

const app = express();
app.use(express.json())
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(checkOrigin);
const port = Number(process.env.PORT) || 3333;

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "OnWallet API",
      version: "1.0.0",
      description: "API for OnWallet application"
    },
    servers: [
      {
        url: process.env.API_URL || `http://localhost:${port}`,
        description: process.env.API_URL ? "Production server" : "Development server"
      }
    ]
  },
  apis: ["./src/routes/*.ts"]
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.get("/health", (req, res) => {
  res.send("OK")
})

app.use('/auth', authRouter)
app.use('/accounts', requireAuth, accountRouter)
app.use('/categories', requireAuth, categoryRouter)
app.use('/transactions', requireAuth, transactionRouter)
app.use('/budgets', requireAuth, budgetRouter)
app.use('/dashboards', requireAuth, dashboardRouter)

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
})
