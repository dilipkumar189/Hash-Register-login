const express = require('express');
const bcrypt = require('bcrypt');
const saltRound = 10;
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const app = express();
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure session middleware
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 10 * 365 * 24 * 60 * 60 * 1000 } // Optional: Set the cookie max age
}));

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'test'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to database');
});

app.post("/register", (req, res) => {
     const { email, password } = req.body;

     bcrypt.hash(password, saltRound, (err, hash) => {
        if(err) {
            console.log(err);
        }
        db.query("INSERT INTO login (email, password) VALUES (?, ?)", [email, hash], (err, result) => {
            if(err) {
                console.log(err);
            }
            res.status(201).json(result);
            console.log(result);
        } )
     })
     
})


// ------------- this code is working for email, password, clinic ------------------------(this is complete login code)
app.post("/signin", (req, res) => {
    const { staffemail, staffpass, staffclinic } = req.body;

    // Fetch the user data including the clinics
    db.query("SELECT * FROM staff WHERE staffemail = ?;", [staffemail], (err, result) => {
        if (err) {
            res.status(400).json(err);
        } else if (result.length > 0) {
            const user = result[0];
            
            // Compare the password hash
            bcrypt.compare(staffpass, user.staffpass, (error, response) => {
                if (error || !response) {
                    res.status(401).json({ message: "Invalid credentials" });
                } else {
                    // Parse the clinic JSON data
                    let clinicData;
                    try {
                        clinicData = JSON.parse(user.staffclinic);
                    } catch (parseError) {
                        return res.status(500).json({ message: "Error parsing clinic data" });
                    }

                    // Check if the provided clinic ID is in the user's clinic list
                    const clinicIds = Object.values(clinicData);
                    if (clinicIds.includes(staffclinic.toString())) {
                        res.status(200).json({ message: "Login successful", user });
                    } else {
                        res.status(401).json({ message: "Clinic mismatch" });
                    }
                }
            });
        } else {
            res.status(401).json({ message: "Wrong details or company mismatch" });
        }
    });
});

//  -----------------this code is working for email and password----------------
// app.post("/signin", (req, res) => {
//     const{ staffemail, staffpass} = req.body;

//     db.query("SELECT * FROM staff WHERE staffemail = ?;", staffemail, (err, result) => {
//         if(err) {
//             res.status(400).json(err);
//         }
//         if( result.length > 0) {
//             bcrypt.compare(staffpass, result[0].staffpass, (error, response) => {
//                 if(error) {
//                     res.status(401).json({ message: "login nhi ho rha h bhai"});
//                 } 
//                 res.status(200).json(response);
//             });
//         }
//         else {
//             res.status(401).json({ message: "Wrong details"})
//         }
//     });
// });
// ------------this code is working--------------

// app.post('/signin', async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     // Fetch user data from the database
//     db.query('SELECT * FROM login WHERE email = ?', email, async (err, results) => {
//       if (err) {
//         console.error("Error during login:", err);
//         return res.status(500).json({ error: "Internal server error" });
//       }

//       if (results.length === 0) {
//         req.session.flash = 'Login Failed';
//         return res.redirect('/admin');
//       }

//       const user = results[0];

//       // Compare hashed password
//       const passwordMatch = await bcrypt.compare(password, user.staffpass);
//       if (!passwordMatch) {
//         req.session.flash = 'Login Failed';
//         return res.redirect('/admin');
//       }

//       if (user.status === 'Active') {
//         const admin = {
//           adminid: user.id,
//           name: `${user.fname} ${user.lname}`
//         };
//         req.session.admin = admin;

//         if (remember) {
//           res.cookie("loginemail", email, { maxAge: 10 * 365 * 24 * 60 * 60 * 1000 });
//           res.cookie("loginPass", password, { maxAge: 10 * 365 * 24 * 60 * 60 * 1000 });
//         } else {
//           res.clearCookie("loginemail");
//           res.clearCookie("loginPass");
//         }

//         req.session.flash = 'Login Successfully';
//         return res.redirect('/dashboard');
//       } else {
//         req.session.flash = 'User Inactivated';
//         return res.redirect('/admin');
//       }
//     });
//   } catch (error) {
//     console.error("Error in login:", error);
//     req.session.flash = 'Internal server error';
//     return res.redirect('/admin');
//   }
// });

// Define your routes
app.get('/admin', (req, res) => {
  res.send(req.session.flash || 'Admin login page');
});

app.get('/dashboard', (req, res) => {
  if (req.session.admin) {
    res.send(`Welcome, ${req.session.admin.name}`);
  } else {
    res.redirect('/admin');
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
