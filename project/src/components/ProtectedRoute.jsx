import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { secureFetch } from "../utils/secureFetch";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("unauthorized"); // 'unauthorized' | 'authorized' | 'not-admin'

  useEffect(() => {
    secureFetch("http://localhost:3000/api/verified/me")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        if (adminOnly && !data.isAdmin) {
          setStatus("not-admin");
        } else {
          setStatus("authorized");
        }
      })
      .catch(() => setStatus("unauthorized"))
      .finally(() => setLoading(false));
  }, [adminOnly]);

  if (loading) return <div>Loading...</div>;
  if (status === "unauthorized") return <Navigate to="/login" />;
  if (status === "not-admin") return <Navigate to="/unauthorized" />;
  return children;
}
