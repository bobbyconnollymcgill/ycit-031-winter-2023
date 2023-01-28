import React, { useState, useEffect } from "react"
import { useTable } from "react-table"
import { Routes, Route, useNavigate, useLocation } from "react-router-dom"

import { useColumns } from "./App.useColumns"

export function App() {
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        console.log("location", location)

        if (location.pathname === "/") {
            fetch("http://localhost:3333/me", {
                credentials: "include", // This is needed to send the session ID cookie to the server (if there is one)
            })
                .then((res) => {
                    if (!res.ok) {
                        return Promise.reject()
                    }

                    return Promise.resolve()
                })
                .catch((error) => {
                    navigate("/login")
                })
        }
    }, [location])

    const [registerUsername, setRegisterUsername] = useState("")
    const [registerPassword, setRegisterPassword] = useState("")

    const [loginUsername, setLoginUsername] = useState("")
    const [loginPassword, setLoginPassword] = useState("")

    const [data, setData] = useState([])

    function fetchPets() {
        fetch("http://localhost:3333/pets", {
            credentials: "include", // This is needed to send the session ID cookie to the server (if there is one)
        })
            .then((res) => {
                if (!res.ok) {
                    return res.text().then((err) => Promise.reject(err))
                }

                return res.json()
            })
            .then((data) => {
                setData(data)
            })
            .catch((error) => {
                // alert(error)
                console.error(error)
            })
    }

    useEffect(() => {
        fetchPets()
    }, [])

    const columns = useColumns()

    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
        useTable({ columns, data })

    function handleRegisterSubmit(e) {
        e.preventDefault()
        console.log("handle register submit")

        setRegisterUsername("")
        setRegisterPassword("")

        fetch("http://localhost:3333/register", {
            method: "POST",
            body: JSON.stringify({
                username: registerUsername,
                password: registerPassword,
            }),
            credentials: "include", // This is needed in POST requests so that the browser sets the cookie into the browser
            headers: {
                "Content-Type": "application/json",
            },
        }).then((response) => {
            console.log("response", response)
            fetchPets()
            navigate("/")
        })
    }

    function handleLoginSubmit(e) {
        e.preventDefault()
        console.log("handle login submit")

        setLoginUsername("")
        setLoginPassword("")

        fetch("http://localhost:3333/login", {
            method: "POST",
            body: JSON.stringify({
                username: loginUsername,
                password: loginPassword,
            }),
            credentials: "include", // This is needed in POST requests so that the browser sets the cookie into the browser
            headers: {
                "Content-Type": "application/json",
            },
        }).then((response) => {
            console.log("response", response)
            fetchPets()
            navigate("/")
        })
    }

    function handleLogout() {
        fetch("http://localhost:3333/logout", {
            method: "POST",
            credentials: "include", // This is needed in POST requests so that the browser sets the cookie into the browser
            headers: {
                "Content-Type": "application/json",
            },
        }).then((response) => {
            console.log("response", response)
            setData([])
            navigate("/login")
        })
    }

    return (
        <div className="App">
            <Routes>
                <Route
                    path="/"
                    element={
                        <>
                            <div>
                                <button onClick={handleLogout}>Log Out</button>
                            </div>
                            <table {...getTableProps()}>
                                <thead>
                                    {headerGroups.map((headerGroup) => (
                                        <tr
                                            {...headerGroup.getHeaderGroupProps()}
                                        >
                                            {headerGroup.headers.map(
                                                (column) => (
                                                    <th
                                                        {...column.getHeaderProps()}
                                                    >
                                                        {column.render(
                                                            "Header"
                                                        )}
                                                    </th>
                                                )
                                            )}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody {...getTableBodyProps()}>
                                    {rows.map((row) => {
                                        prepareRow(row)
                                        return (
                                            <tr {...row.getRowProps()}>
                                                {row.cells.map((cell) => {
                                                    return (
                                                        <td
                                                            {...cell.getCellProps()}
                                                        >
                                                            {cell.render(
                                                                "Cell"
                                                            )}
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </>
                    }
                />

                <Route
                    path="register"
                    element={
                        <div
                            className="register-form"
                            style={{ maxWidth: "500px" }}
                        >
                            <h3>Register</h3>
                            <form onSubmit={handleRegisterSubmit}>
                                <label>Username</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={registerUsername}
                                    onChange={(e) =>
                                        setRegisterUsername(e.target.value)
                                    }
                                />
                                <label>Password</label>
                                <input
                                    type="text"
                                    name="password"
                                    value={registerPassword}
                                    onChange={(e) =>
                                        setRegisterPassword(e.target.value)
                                    }
                                />
                                <input type="submit" value="Submit" />
                            </form>
                            <button onClick={() => navigate("/login")}>
                                I already have an account
                            </button>
                        </div>
                    }
                />

                <Route
                    path="login"
                    element={
                        <div
                            className="login-form"
                            style={{ maxWidth: "500px" }}
                        >
                            <h3>Login</h3>

                            <form onSubmit={handleLoginSubmit}>
                                <label>Username</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={loginUsername}
                                    onChange={(e) =>
                                        setLoginUsername(e.target.value)
                                    }
                                />
                                <label>Password</label>
                                <input
                                    type="text"
                                    name="password"
                                    value={loginPassword}
                                    onChange={(e) =>
                                        setLoginPassword(e.target.value)
                                    }
                                />
                                <input type="submit" value="Submit" />
                            </form>
                            <button onClick={() => navigate("/register")}>
                                I don't have an account
                            </button>
                        </div>
                    }
                />
            </Routes>
        </div>
    )
}
