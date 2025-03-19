const express = require("express");
const app = express();
const path = require("path");
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
//this is the code for connecting with the database
var mysql = require("mysql");
var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "foodredistribution"
});
connection.connect(function (err) {
    if (err) console.log(err);
});
//following is the slash route
app.get("/", async (req, res) => {
    res.render("home.ejs");
});
app.get("/signin", async (req, res) => {
    res.render("signin.ejs", { error: "" });
});
app.get("/contact", async (req, res) => {
    res.render("contact.ejs");
});
app.get("/signup", async (req, res) => {
    res.render("signup.ejs");
});
//following block of code is used for login purpose if account exist if not then show message not have account
//show message of worng password 
let Id;   //global id that contain donor id of the use how is login 
app.post("/signin", async (req, res) => {
    const { email, password, category } = req.body;
    if (category == "donor") {
        var sqlDonorExtract = "select LOWER(email) AS email, LOWER(dpassword) as dpassword, did from donor";
        connection.query(sqlDonorExtract, (err, result) => {
            if (err) console.error("Error executing query for checking id password of donor :", err.message);
            else {
                let i = 0;
                for (; i < result.length; i++) {
                    if (email == result[i].email && password == result[i].dpassword) {
                        res.render("insertfood.ejs"); //donor will insert food in the 
                        Id = result[i].did;
                        return;
                    }
                    else if (email == result[i].email) {
                        res.render("signin.ejs", { error: "wrong password" });
                        return;
                    }
                }
                if (i == result.length) {
                    res.render("signin.ejs", { error: "Don't have an account" });
                }
            }
        });
    }
    else if (category == "requestor") {
        var sqlRequestorExtract = "select LOWER(email) AS email, LOWER(rpassword) as rpassword, rid from requester";
        connection.query(sqlRequestorExtract, (err, result) => {
            if (err) console.error("Error executing query for checking id password of requestor :", err.message);
            else {
                let i = 0;
                for (; i < result.length; i++) {
                    if (email === result[i].email && password === result[i].rpassword) {
                        Id = result[i].fid;
                        res.redirect("/fooditem");
                        return;
                    }
                    else if (email == result[i].email) {
                        res.render("signin.ejs", { error: "wrong password" });
                        return;
                    }
                }
                if (i == result.length) {
                    res.render("signin.ejs", { error: "Don't have an account" });
                }
            }
        });
    }
    else {
        var sqlAdminExtract = "select LOWER(email) AS email, LOWER(apassword) as apassword from administrator";
        connection.query(sqlAdminExtract, (err, result) => {
            if (err) console.error("Error executing query for checking id password of requestor :", err.message);
            else {
                let i = 0;
                for (; i < result.length; i++) {
                    if (email === result[i].email && password === result[i].apassword) {
                        res.redirect("/admin");
                        return;
                    }
                    else if (email == result[i].email) {
                        res.render("signin.ejs", { error: "wrong password" });
                        return;
                    }
                }
                if (i == result.length) {
                    res.render("signin.ejs", { error: "Don't have an account" });
                }
            }
        });
    }
});
//following block of code is use to create account for the user wheather he is administrator donor or requestor
app.post("/signup", async (req, res) => {
    const { name, email, password, contact, address, category } = req.body;
    if (category == "donor") {
        var sqlDonorInsert = "INSERT INTO donor (did, dname, email, dpassword, contact, address) VALUES (?, ?, ?, ?, ?, ?)";
        var sqlDonorExtract = "select dname from donor";

        connection.query(sqlDonorExtract, (err, result) => {
            if (err) console.error('Error executing query for counting donors :', err.message);
            else {
                did = result.length;
                did++;
                const values = [did, name, email, password, contact, address];
                connection.query(sqlDonorInsert, values, (err, result) => {
                    if (err) console.error('Error executing query:', err.message);
                    else console.log('Donor account is created successfully.');
                });
            }
        });
    }
    else if (category == "requestor") {
        var sqlDonorInsert = "INSERT INTO requester (rid, rname, email, contact, address, rpassword) VALUES (?, ?, ?, ?, ?, ?)";
        var sqlDonorExtract = "select rname from requester";
        connection.query(sqlDonorExtract, (err, result) => {
            if (err) console.error('Error executing query for counting requester :', err.message);
            else {
                rid = result.length;
                rid++;
                const values = [rid, name, email, contact, address, password];
                connection.query(sqlDonorInsert, values, (err, result) => {
                    if (err) console.error('Error executing query:', err.message);
                    else console.log('Requestor account is created successfully.');
                });
            }
        });
    }
    else {
        var sqlAdminInsert = "INSERT INTO administrator (aid, aname, email, apassword) VALUES (?, ?, ?, ?)";
        var sqlAdminExtract = "select aname from administrator";
        connection.query(sqlAdminExtract, (err, result) => {
            if (err) console.error('Error executing query for counting requester :', err.message);
            else {
                aid = result.length + 1;
                const values = [aid, name, email, password];
                connection.query(sqlAdminInsert, values, (err, result) => {
                    if (err) console.error('Error executing query:', err.message);
                    else console.log('Admin account is created successfully.');
                });
            }
        });
    }
    res.redirect("/");
});
app.get("/fooditem", async (req, res) => {
    //this query will extract the data of donated food with donor name and contact number 
    const sqlfood = "select f.fid, f.fname, f.quantity, f.expirydate, f.address, d.dname, d.contact from donor d join fooditem f where d.did = f.did;";
    connection.query(sqlfood, function (err, result) {
        if (err) console.log(err);
        let arr = [];
        res.render("fooditem.ejs", { data: result, arr });
        console.log(arr);
    })
});
//whole code is used to insert food item in the database 
app.post("/insertfood", (req, res) => {
    const { fname, quantity, expirydate, address } = req.body;
    var sqlFoodInsert = "INSERT INTO fooditem (fid, did, fname, quantity, expirydate, address) VALUES (?, ?, ?, ?, ?, ?)";
    var sqlFoodExtract = "select fname from fooditem";
    //count number of food items 
    connection.query(sqlFoodExtract, async (err, result) => {
        if (err) console.error('Error executing query for counting food items :', err.message);
        fid = result.length + 1;
        ///enter food in the database
        const values = [fid, Id, fname, quantity, expirydate, address];
        connection.query(sqlFoodInsert, values, (err, result) => {
            if (err) console.error('Error executing query:', err.message);
            else console.log('Row inserted successfully.');
        });
    });
    res.redirect("/");
});
app.post("/fooditem", (req, res) => {
    console.log(req.body);
});
app.get("/admin", async (req, res) => {
    res.render("admin.ejs");
});
//for admin page donor report
app.get("/donorReport", async (req, res) => {
    const sqlDonorReport = "SELECT dname, email, address from donor";
    connection.query(sqlDonorReport, async (err, result) => {
        if (err) console.error('Error executing query:', err.message);
        else console.log('Report generated successfully');
        res.render("donorReport.ejs", { reportData: result });
    });
});
//for admin page requestor report
app.get("/requesterReport", async (req, res) => {
    const sqlrequesterReport = "SELECT rname, email, address from requester";
    connection.query(sqlrequesterReport, async (err, result) => {
        if (err) console.error('Error executing query:', err.message);
        else console.log('Report generated successfully');
        res.render("requesterReport.ejs", { reportData: result });
    });
});
//for admin page donation report
app.get("/donationReport", async (req, res) => {
    const sqlDonorReport = "SELECT d.dname, d.email, r.foodName, r.quantity, r.date from report r join donor d where r.did = d.did;";
    connection.query(sqlDonorReport, async (err, result) => {
        if (err) console.error('Error executing query:', err.message);
        else console.log('Report generated successfully');
        res.render("donationReport.ejs", { reportData: result });
    });
});
app.get("/getInvolve", async (req, res) => {
    res.render("getInvolve.ejs");
});

// Middleware to parse JSON requests
app.use(express.json());

// Route to handle deletion of a record
app.post('/delete-record', (req, res) => {
    const recId = req.body.id;
    var sqlReportInsert = "INSERT INTO report(did, foodName, quantity) VALUES (?, ?, ?)";
    connection.query('SELECT did, fname, quantity FROM fooditem WHERE fid = ?', [recId], (err, result) => {
        if (err) {
            console.error('Error executing query:', err.message);
            return;
        }
        if (result.length > 0) {
            const { did, fname, quantity } = result[0]; // Access the first row of the result
            const values = [did, fname, quantity]; // Replace Id with the appropriate value
            connection.query(sqlReportInsert, values, (err, result) => {
                if (err) console.error('Error executing insert query:', err.message);
                else {
                    connection.query('delete FROM fooditem WHERE fid = ?', [recId], (err, result) => {
                        if (err) {
                            console.error('Error executing query:', err.message);
                            return;
                        }
                    });
                }
            });
        }
        else console.log('No data found for the provided recId.');
    });
});

app.listen(3000);