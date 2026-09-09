import express from "express";
import cors from "cors";
import accountRouter from "./routes/account.routes.js";
import categoryRouter from "./routes/category.routes.js";
import transactionRouter from "./routes/transaction.routes.js";
import budgetRouter from "./routes/budget.routes.js";
import dashboardRouter from "./routes/dashborad.routes.js"
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";

const app = express();
app.use(express.json())
app.use(cors());
const port = 3333;

const swaggerOptions= {
  swaggerDefinition:{
    openapi: "3.0.0",
    info:{
      title: "OnWallet API",
      version: "1.0.0",
      description: "API for OnWallet application"
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: "Development server"
      }
    ]
  },
  apis: ["./src/routes/*.ts"]
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.get("/health", (req, res)=>{
  res.send("OK")
})

app.use('/accounts', accountRouter)
app.use('/categories', categoryRouter)
app.use('/transactions', transactionRouter)
app.use('/budgets', budgetRouter)
app.use('/dashboards', dashboardRouter)

app.listen(port, ()=>{
  console.log(`Server is running on port http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
})
