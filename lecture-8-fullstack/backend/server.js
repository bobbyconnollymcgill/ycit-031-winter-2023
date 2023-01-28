const bcrypt = require("bcrypt")
const express = require("express")
const session = require("express-session")
const pgSession = require("connect-pg-simple")(session)

const { Pool } = require("pg")

const FRONTEND_ORIGIN = "http://localhost:8081"

const databaseConnectionSettings = {
    user: "postgres",
    password: "password",
    host: "localhost",
    port: "5432",
    database: "postgres",
}

const db = new Pool(databaseConnectionSettings)

const app = express()

app.use(express.json())

app.use((req, res, next) => {
    console.log(`${req.method} request received for ${req.url} from ${req.ip}`)
    next()
})

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN)
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")
    res.setHeader("Access-Control-Allow-Credentials", "true")

    next()
})

app.use(
    session({
        store: new pgSession({
            pool: db, // use the connection pool
            tableName: "sessions", // name of the table to store sessions in
        }),
        secret: "this-is-a-secretsaof3498thwevniut23hfuiehdghwiughdkjfhksdjhfkj7", // secret key to encrypt the session data
        resave: false, // don't save the session if it hasn't been modified
        saveUninitialized: false, // don't create a session until the user has logged in
        cookie: {
            httpOnly: false, // Use this to make the cookie inaccessible via javascript running in the browser
            maxAge: 30 * 24 * 60 * 60 * 1000,
        },
    })
)

app.use((req, res, next) => {
    console.log("session user", req.session.user)

    // if (req.session.user?.id === 34) {
    //     res.status(400).send("you have been banned")
    //     return
    // }

    next()
})

app.get("/", async (req, res) => {
    const text = "select name from pets;"

    const result = await db.query(text)

    const pets = result.rows.map((el) => el.name).join(", ")

    res.send("it's working! " + pets)
})

function authMiddleware(req, res, next) {
    if (!req.session.user) {
        res.status(401).json({ error: "unauthorized" })
        return
    }

    next()
}

app.get("/pets", authMiddleware, async (req, res) => {
    const result = await db.query(
        "SELECT id, name, species, breed, age, weight FROM pets;"
    )

    res.json(result.rows)
})

app.get("/me", authMiddleware, async (req, res) => {
    console.log("req.session.user", req.session.user)

    if (!req.session.user) {
        res.status(401).end()
        return
    }

    console.log("here?")
    res.json(req.session?.user)
})

// app.get("/session", (req, res) => {
//     if (!req.session.views) {
//         req.session.views = 0
//     }

//     if (!req.session.country) {
//         req.session.country = "canada"
//     }

//     req.session.whatever = "blabla"
//     req.session.views++

//     res.send(`You viewed this page ${req.session.views} times`)
// })

app.post("/register", async (req, res) => {
    console.log("TACO!!!!", req.body)

    try {
        const selectText = "SELECT id FROM users WHERE username = $1"
        const selectValues = [req.body.username]

        const selectResult = await db.query(selectText, selectValues)

        // console.log("selectResult", selectResult)

        if (selectResult.rowCount > 0) {
            res.status(400).send("user with that username already exists")
            return
        }

        // Salt and hash the password
        const salt = bcrypt.genSaltSync(10)
        const hashedPassword = bcrypt.hashSync(req.body.password, salt)

        const insertText = "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *" // prettier-ignore
        const insertValues = [req.body.username, hashedPassword]
        const insertResult = await db.query(insertText, insertValues)

        console.log(
            "storing user context into the session",
            insertResult.rows[0].id
        )

        req.session.user = {
            id: insertResult.rows[0].id,
        }

        res.end()
    } catch (error) {
        console.log("ERROR!!", error)
        res.status(500).send(error.message)
    }
})

app.post("/login", async (req, res) => {
    try {
        if (req.session.user?.id) {
            res.end()
            return
        }

        console.log("req.body", req.body)

        const selectText = "SELECT id, password FROM users WHERE username = $1"
        const selectValues = [req.body.username]

        const selectResult = await db.query(selectText, selectValues)

        if (selectResult.rowCount === 0) {
            res.status(401).end() // send back a 401 even though it "feels like" a 404
            return
        }

        // Compare entered password with stored hashed password
        if (
            !bcrypt.compareSync(
                req.body.password,
                selectResult.rows[0].password
            )
        ) {
            res.status(401).end()
            return
        }

        req.session.user = {
            id: selectResult.rows[0].id,
        }

        res.end()
    } catch (error) {
        console.log("ERROR!!", error)
        res.status(500).send(error.message)
    }
})

app.post("/logout", (req, res) => {
    req.session.destroy()
    res.clearCookie("connect.sid")
    res.end()
})

db.connect()
    .then(() => {
        app.listen(3333, () => {
            console.log("listening on 3333")
        })
    })
    .catch((error) => {
        console.log("could not connect to the DB", error)
    })
