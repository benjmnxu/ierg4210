import { useState } from 'react';
import "./style.css";
import { secureFetch } from '../../utils/secureFetch';

function AuthPage() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const endpoint = mode === "signup" ? "signup" : "login";
    const payload =
      mode === "signup"
        ? { email, password, name, admin_code: adminCode }
        : { email, password };

    try {
      
      const response = await secureFetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `${mode === "signup" ? "Signup" : "Login"} failed`);
      }

      if (mode === "signup") {
        setSuccessMsg("Signup successful! You're now logged in.");
      }

      window.location.href = "/";
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">{mode === "login" ? "Login" : "Sign Up"}</h2>

      {errorMsg && <p className="login-error">{errorMsg}</p>}
      {successMsg && <p className="login-success">{successMsg}</p>}

      <form className="login-form" onSubmit={handleSubmit}>
        {mode === "signup" && (
          <>
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={1}
              maxLength={100}
              required
            />
          </>
        )}

        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={100}
          required
        />

        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          maxLength={100}
          minLength={1}
        />

        {mode === "signup" && (
          <>
            <label htmlFor="adminCode">Admin Code (optional):</label>
            <input
              type="text"
              id="adminCode"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              maxLength={100}
            />
          </>
        )}

        <button type="submit" className="login-button">
          {mode === "login" ? "Login" : "Sign Up"}
        </button>
      </form>

      <div className="toggle-auth">
        {mode === "login" ? (
          <p>
            Don't have an account?{" "}
            <button onClick={() => setMode("signup")}>Sign Up</button>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <button onClick={() => setMode("login")}>Log In</button>
          </p>
        )}
      </div>
    </div>
  );
}

export default AuthPage;
