import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom"; 

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const validate = () => {
    const { name, email, password } = form;
    if (!name || !email || !password) return "All fields are required";
    if (!/\S+@\S+\.\S+/.test(email)) return "Invalid email format";
    if (password.length < 6) return "Password must be at least 6 characters";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) return alert(error);

    try {
      await axios.post("http://localhost:5000/register", form);
      alert("Registration successful!");
      navigate("/login");
    } catch (err) {
      if (err.response?.status === 409) {
        alert("Email already registered");
      } else {
        alert("Registration failed");
      }
    }
  };

  return (
    <div className="container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Name"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Email"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button type="submit">Register</button>
      </form>

      <p style={{ marginTop: "10px" }}>
        Already a user? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default Register;
