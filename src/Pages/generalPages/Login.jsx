import { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import styles from "./CSS/Login.module.css";
import UserHome from './../user/JSX/UserHome';
import { saveToken } from "../../utils/tokenUtils";
import axios from "axios"
import Payment from './../user/JSX/Payment';
import { Link } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: false }));
  };

  const validate = () => {
    const errs = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Please enter a valid email";
    if (form.password.length < 6)
      errs.password = "Password must be at least 6 characters";
    return errs;
  };

 const handleSubmit = async (e) => {
  e.preventDefault()
  const errs = validate()
  if (Object.keys(errs).length) { setErrors(errs); return }

  try {
    setLoading(true)

    const payload = { email: form.email, password: form.password }

    const response = await axios.post("http://localhost:8080/api/auth/login", payload)

    saveToken(response.data.token)
    const user = response.data;

    if(user.role.toUpperCase() == "USER")
    {

        navigate("/user-home")
      
    }
    else if(user.role.toUpperCase() == "STUFF")
    {

         navigate("/stuff-home")

    }
    else if(user.role.toUpperCase() == "ADMIN")
    {

        navigate("/home-admin")

    }
    
    

  } catch (err) {
    const message = err.response?.data?.error || "Invalid email or password"
    setErrors({ password: message })
  } finally {
    setLoading(false)
  }
}

  const handleGoogle = () => {
   
     window.location.href = "http://localhost:8080/oauth2/authorization/google";

  };

  return (
    <div className={styles["ln-page"]}>
      <div className={styles["ln-grid-bg"]} />

      {/* ── Left decorative panel ── */}
      <div className={styles["ln-left"]}>
        <div className={styles["ln-left-content"]}>
          <div className={styles["ln-logo"]}>Drive<span>X</span></div>
          <div className={styles["ln-tagline"]}>Premium Car Rental</div>
          <div className={styles["ln-illustration"]}>
            <div className={styles["ln-car-icon"]}>🚗</div>
            <div className={styles["ln-glow"]} />
          </div>
          <blockquote className={styles["ln-quote"]}>
            "The open road is calling.<br />Your perfect ride awaits."
          </blockquote>
          <div className={styles["ln-dots"]}>
            <span className={`${styles["ln-dot"]} ${styles.active}`} />
            <span className={styles["ln-dot"]} />
            <span className={styles["ln-dot"]} />
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <main className={styles["ln-right"]}>
        <div className={styles["ln-form-box"]}>
          <div className={styles["ln-form-header"]}>
            <h1 className={styles["ln-heading"]}>Welcome <em>Back</em></h1>
            <p className={styles["ln-desc"]}>Sign in to manage your bookings and explore available vehicles.</p>
          </div>

          <button className={styles["ln-google-btn"]} onClick={handleGoogle}>
            <svg className={styles["ln-google-icon"]} viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className={styles["ln-divider"]}>
            <span className={styles["ln-divider-line"]} />
            <span className={styles["ln-divider-text"]}>or sign in with email</span>
            <span className={styles["ln-divider-line"]} />
          </div>

          <form onSubmit={handleSubmit} noValidate>

            <div className={styles["ln-field"]}>
              <label className={styles["ln-label"]}>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set("email")}
                className={errors.email ? styles.err : ""}
                autoComplete="email"
              />
              {errors.email && <span className={styles["ln-error"]}>{errors.email}</span>}
            </div>

            <div className={styles["ln-field"]}>
              <div className={styles["ln-label-row"]}>
                <label className={styles["ln-label"]}>Password</label>
                <Link to = "/forget-password"  className={styles["ln-forgot"]}>Forgot password?</Link>
              </div>
              <div className={styles["ln-input-wrap"]}>
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={set("password")}
                  className={errors.password ? styles.err : ""}
                  autoComplete="current-password"
                />
                <span className={styles["ln-eye"]} onClick={() => setShowPwd((v) => !v)}>
                  {showPwd ? "🙈" : "👁"}
                </span>
              </div>
              {errors.password && <span className={styles["ln-error"]}>{errors.password}</span>}
            </div>

          {/*  <label className={styles["ln-remember"]}>
              <input type="checkbox" />
              <span>Keep me signed in</span>
            </label> */}

            <button
              type="submit"
              className={`${styles["ln-btn"]} ${styles["ln-btn-primary"]} ${loading ? styles.loading : ""}`}
              disabled={loading}
            >
              {loading ? <span className={styles["ln-spinner"]} /> : "Sign In →"}
            </button>

          </form>

          <p className={styles["ln-signup-link"]}>
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </main>
    </div>
  );
}