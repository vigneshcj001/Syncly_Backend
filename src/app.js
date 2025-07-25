const express = require("express");
const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello from server!!");
});
app.get("/user", (req, res) => {
  res.send({
    firstName: "John",
    lastName: "Doe",
    age: 30,
  });
});
app.post("/user", (req, res) => {
  res.send("User created successfully!");
});
app.delete("/user",(req,res)=>{
    res.send("User deleted successfully");
});
app.get("/test", (req, res) => {
  res.send("Hello from test route!!");
});
 
app.get("/Hello", (req, res) => {
  res.send("Hello from Hello route!!");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
