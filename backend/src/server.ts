import "dotenv/config";
import app from './app.js';

const port = Number(process.env.PORT) || 3333;

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
})
