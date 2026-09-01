import express from "express";
import cors from "cors";
import accountRouter from "./routes/account.routes.js";
import categoryRouter from "./routes/category.route.js";
import transactionRouter from "./routes/transaction.routes.js";

const app = express();
app.use(express.json())
app.use(cors());
const port = 3333;

app.get("/health", (req, res)=>{
  res.send("OK")
})

app.use('/accounts', accountRouter)
app.use('/categories', categoryRouter)
app.use('/transactions', transactionRouter)

app.listen(port, ()=>{
  console.log(`Server is running on port http://localhost:${port}`);
})