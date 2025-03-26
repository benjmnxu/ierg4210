import { useState } from 'react';
import "./style.css";

function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/verified/change-password", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
            currentPassword: currentPassword,
            newPassword: newPassword
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Password change failed.");
      }

      setSuccessMsg("Password changed successfully.");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Change Password</h2>

      {errorMsg && <p className="login-error">{errorMsg}</p>}
      {successMsg && <p className="login-success">{successMsg}</p>}

      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="currentPassword">Current Password:</label>
        <input
          type="password"
          id="currentPassword"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />

        <label htmlFor="newPassword">New Password:</label>
        <input
          type="password"
          id="newPassword"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <label htmlFor="confirmPassword">Confirm New Password:</label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button type="submit" className="login-button">
          Change Password
        </button>
      </form>
    </div>
  );
}

export default ChangePasswordPage;
