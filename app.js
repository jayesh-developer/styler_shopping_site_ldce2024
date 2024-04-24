require("dotenv").config();

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 8001;

mongoose.connect("mongodb://localhost:27017/Ecommerce", { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Error connecting to MongoDB:', err));

// Define user schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  address: String,
  city: String,
  pincode: String,
  state: String,
  ph_no: String
});

// Create user model
const User = mongoose.model('User', userSchema);

// Define schema for the cart item
const cartItemSchema = new mongoose.Schema({
  productName: String,
  totalPrice: Number
});

// Create model for the cart item
const CartItem = mongoose.model('CartItem', cartItemSchema);

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Middleware for parsing request body
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware for session management
app.use(session({
  secret: 'secret', // Change this to a random secret
  resave: false,
  saveUninitialized: true,
}));



// Serve static files from the 'public' directory
app.use(express.static('assets'));
app.use(express.static('assets/css'));
app.use(express.static('assets/fonts'));
app.use(express.static('assets/images'));
app.use(express.static('assets/js'));

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));



// Register route
app.get('/register', async (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    // Create a new user
    const newUser = new User({
      email: req.body.email,
      password: hashedPassword,
      name: req.body.name,
      address: req.body.address,
      city: req.body.city,
      pincode: req.body.pincode,
      state: req.body.state,
      ph_no: req.body.ph_no
    });
    // Save the user to the database
    await newUser.save();
    res.redirect('/index');
    //res.send('User registered successfully!');
  } catch (error) {
    res.status(500).send('Error registering user');
  }
});

// Login route
app.get('/', async (req, res) => {
  res.render('login');
});
app.get('/login', async (req, res) => {
  res.render('login');
});

// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  // Find the user by email
  const user = await User.findOne({ email });
  if (user) {
    // Compare the provided password with the hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (passwordMatch) {
      // Set the user ID in the session
      req.session.userId = user._id;
      // Redirect the user to the index page
      res.redirect('/index');
    } else {
      res.status(401).send('Invalid email or password');
    }
  } else {
    res.status(401).send('Invalid email or password');
  }
});


// Logout route
app.get('/logout', async (req, res) => {
  res.render('logout');
});
app.post('/logout', (req, res) => {
  // Destroy the session
  req.session.destroy(err => {
    if (err) {
      res.status(500).send('Error logging out');
    } else {
      res.send('Logout successful!');
    }
  });
});

//routes
//app.get("/", async (req, res) => {
//    res.render("index");
//});

// Route handler for index page
app.get('/index', (req, res) => {
  // Check if the user is logged in (session exists)
  if (req.session && req.session.userId) {
    // Render the index.ejs page
    res.render('index');
  } else {
    // Redirect to the login page if the user is not logged in
    res.redirect('/login');
  }
});

app.get("/about", async (req, res) => {
  res.render("about");
});

app.get("/products", async (req, res) => {
  res.render("products");
});



// Define products data
const products = [
  { id: 1, name: 'T-shirt', image: 'ts.png', price: 50.00 },
  { id: 2, name: 'Shirt', image: 'sh.jpeg', price: 100.00 },
  { id: 3, name: 'Hoodies', image: 'ho.png', price: 120.00 },
  { id: 4, name: 'Cargo pants', image: 'car.png', price: 40.00 },
  { id: 5, name: 'Jeans pants', image: 'jeans.png', price: 28.00 },
  { id: 6, name: 'Chinos pants', image: 'chinos.png', price: 98.00 },
  { id: 7, name: 'Belts', image: 'bel.jpeg', price: 405.00 },
  { id: 8, name: 'Summer Cap', image: 'cap.png', price: 389.00 },
  { id: 9, name: 'Sun glasses', image: 'Image_Editor (8).png', price: 789.00 },
  // Add more products as needed
];

app.get('/single-product', (req, res) => {
  const productId = parseInt(req.query.productId);
  const product = products.find(p => p.id === productId);

  if (product) {
      res.render('single-product', { product });
  } else {
      res.status(404).send('Product not found');
  }
});

// API endpoint to add item to cart
app.post('/api/cart/add', async (req, res) => {
  const { productName, totalPrice } = req.body;

  try {
      // Save the cart item to the database
      const newItem = new CartItem({ productName, totalPrice });
      await newItem.save();

      res.status(200).json({ success: true, message: 'Item added to cart successfully.' });
  } catch (error) {
      console.error('Error adding item to cart:', error);
      res.status(500).json({ success: false, message: 'An error occurred while adding item to cart.' });
  }
});

app.get("/contact", async (req, res) => {
  res.render("contact");
});


app.listen(PORT, () => console.log(`Server Started at http://localhost:${PORT}`));
