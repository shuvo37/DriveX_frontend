import { useState, useRef } from "react";
import styles from "./CSS/Register.module.css";
import axios  from "axios";
import { data } from 'react-router-dom';
import Login from "./Login";
import { useNavigate } from "react-router-dom";



const TOTAL_STEPS = 2;

const STEPS_META = [
  { label: "Personal Info",    sub: "Name, email, phone, city" },
  { label: "Account Security", sub: "Password setup" },
];


function getPasswordScore(pwd) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

const STRENGTH_COLORS = ["#ff5757", "#f97316", "#facc15", "#4ade80"];
const STRENGTH_LABELS = ["Weak", "Fair", "Good", "Strong"];

export default function Register() {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(null);
  const avatarInputRef = useRef(null);
  const [imageFile , setImageFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", dob: "",
    password: "", confirm: "" , imageUrl:""
  });

  const [errors, setErrors] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);


  const navigate = useNavigate();


    const handleAvatar = (e) => {
    const file = e.target.files[0];
    if(file)
    {

        setImageFile(file);

        setAvatarSrc(URL.createObjectURL(file));

    }
  

  };


  const getImageUrl = async (file) =>
 {

       const formData = new FormData();

       formData.append("file" , file);

       const response =  await axios.post("http://localhost:8080/api/images/upload" , formData);

       console.log(response.data);

       return response.data;


  };




  const set = (field) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
    setErrors((err) => ({ ...err, [field]: false }));
    setServerError("");
  };

  const validate = (s) => {
    const errs = {};
    if (s === 1) {
      if (!form.firstName.trim()) errs.firstName = "First name is required";
      if (!form.lastName.trim())  errs.lastName  = "Last name is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Please enter a valid email";
      if (form.phone.trim().length < 7) errs.phone = "Phone number is required";
      if (!form.dob) {
        errs.dob = "Date of birth is required";
      } else {
        const age = (Date.now() - new Date(form.dob)) / 31557600000;
        if (age < 16) errs.dob = "Must be 16+ to rent";
      }
    }
    return errs;
  };



  const next = () => {
    const errs = validate(step);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStep((s) => s + 1);
  };

  const prev = () => setStep((s) => s - 1);

  const goTo = (n) => { if (n < step) setStep(n); };

  const submit = async () => {
    const errs = {};
    if (form.password.length < 8) errs.password = "Password must be at least 8 characters";
    if (form.password !== form.confirm) errs.confirm = "Passwords do not match";
    if (Object.keys(errs).length) { setErrors(errs); return; }

     let imgUrl = null;

     if(imageFile)
     {

         imgUrl = await getImageUrl(imageFile);
     }

    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phoneNumber: form.phone,   
      dateOfBirth: form.dob,
      password: form.password,
      confirmPassword: form.confirm,
      profileImage: imgUrl
    };

    try {
      setLoading(true);
      setServerError("");

      const response = await axios.post("http://localhost:8080/api/auth/register" , payload);

       console.log(response.data);
       console.log(response.status);

      setDone(true);

    } catch (err) {

        if(err.response)
        {

             console.log(err.response.data)

        }

      setServerError("Cannot connect to server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };



  const pwdScore = getPasswordScore(form.password);
  const progress = done ? 100 : (step / TOTAL_STEPS) * 100;

  return (
    <div className={styles["rx-page"]}>
      <div className={styles["rx-grid-bg"]} />

      <aside className={styles["rx-left"]}>
        <div>
          <div className={styles["rx-logo"]}>Drive<span>X</span></div>
          <div className={styles["rx-tagline"]}>Premium Car Rental</div>
          <nav className={styles["rx-steps"]}>
            {STEPS_META.map((meta, i) => {
              const n = i + 1;
              const isActive = step === n && !done;
              const isDone   = step > n || done;
              return (
                <div
                  key={n}
                  className={`${styles["rx-step-item"]} ${isActive ? styles.active : ""} ${isDone ? styles.done : ""}`}
                  onClick={() => goTo(n)}
                >
                  <div className={styles["rx-step-num"]}>{isDone ? "✓" : n}</div>
                  <div className={styles["rx-step-info"]}>
                    <span className={styles["rx-step-label"]}>{meta.label}</span>
                    <span className={styles["rx-step-sub"]}>{meta.sub}</span>
                  </div>
                </div>
              );
            })}
          </nav>
        </div>
        <div>
          <div className={styles["rx-progress-bar"]}>
            <div className={styles["rx-progress-fill"]} style={{ width: `${progress}%` }} />
          </div>
          <p className={styles["rx-left-footer"]}>
            Already have an account?<button style={{background:'none' , border : 'none'}} onClick={()=>navigate("/")}>Sign in</button>
          </p>
        </div>
      </aside>

      <main className={styles["rx-right"]}>

        {done && (
          <div className={styles["rx-success"]}>
            <div className={styles["rx-success-icon"]}>✓</div>
            <h2>Welcome to DriveX!</h2>
            <p>Your account has been created successfully.<br /></p>
            <button className={`${styles["rx-btn"]} ${styles["rx-btn-primary"]}`} style={{ maxWidth: 220, margin: "0 auto" }}
              onClick={()=>navigate("/login")}>
              Go to Login →
            </button>
          </div>
        )}

        {!done && step === 1 && (
          <div className={styles["rx-panel"]}>
            <h1 className={styles["rx-heading"]}>Your <em>Details</em></h1>
            <p className={styles["rx-desc"]}>Tell us about yourself. This information is used for account verification and booking confirmations.</p>
            <div className={styles["rx-avatar-row"]}>
              <div className={styles["rx-avatar-circle"]} onClick={() => avatarInputRef.current.click()}>
                {avatarSrc ? <img src={avatarSrc} alt="avatar" /> : "📷"}
              </div>
              <div className={styles["rx-avatar-info"]}>
                <strong>Profile Photo</strong>
                Optional but recommended<br />
                <span className={styles["rx-avatar-btn"]} onClick={() => avatarInputRef.current.click()}>Upload photo</span>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatar} />
            </div>
            <div className={styles["rx-form-row"]}>
              <Field styles={styles} label="First Name" error={errors.firstName}>
                <input type="text" placeholder="e.g. Alex" value={form.firstName} onChange={set("firstName")} className={errors.firstName ? styles.err : ""} />
              </Field>
              <Field styles={styles} label="Last Name" error={errors.lastName}>
                <input type="text" placeholder="e.g. Morgan" value={form.lastName} onChange={set("lastName")} className={errors.lastName ? styles.err : ""} />
              </Field>
            </div>
            <Field styles={styles} label="Email Address" error={errors.email}>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} className={errors.email ? styles.err : ""} />
            </Field>
            <div className={styles["rx-form-row"]}>
              <Field styles={styles} label="Phone Number" error={errors.phone}>
                <input type="tel" placeholder="+880 1XXX XXXXXX" value={form.phone} onChange={set("phone")} className={errors.phone ? styles.err : ""} />
              </Field>
              <Field styles={styles} label="Date of Birth" error={errors.dob} hint="Minimum age: 16 years">
                <input type="date" value={form.dob} onChange={set("dob")} className={errors.dob ? styles.err : ""} />
              </Field>
            </div>
            <div className={styles["rx-btn-row"]}>
              <button className={`${styles["rx-btn"]} ${styles["rx-btn-primary"]}`} onClick={next}>Continue →</button>
            </div>
          </div>
        )}

        {!done && step === 2 && (
          <div className={styles["rx-panel"]}>
            <h1 className={styles["rx-heading"]}>Secure <em>Access</em></h1>
            <p className={styles["rx-desc"]}>Create a strong password to protect your account. Use a mix of letters, numbers, and symbols.</p>
            <Field styles={styles} label="Password" error={errors.password}>
              <div className={styles["rx-input-wrap"]}>
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={set("password")}
                  className={errors.password ? styles.err : ""}
                />
                <span className={styles["rx-eye"]} onClick={() => setShowPwd((v) => !v)}>{showPwd ? "🙈" : "👁"}</span>
              </div>
              {form.password.length > 0 && (
                <>
                  <div className={styles["rx-strength-bar"]}>
                    {[0,1,2,3].map((i) => (
                      <div key={i} className={styles["rx-seg"]} style={{ background: i < pwdScore ? STRENGTH_COLORS[pwdScore - 1] : "var(--border)" }} />
                    ))}
                  </div>
                  <div className={styles["rx-strength-label"]} style={{ color: STRENGTH_COLORS[pwdScore - 1] }}>
                    {STRENGTH_LABELS[pwdScore - 1] || "Weak"}
                  </div>
                </>
              )}
            </Field>
            <Field styles={styles} label="Confirm Password" error={errors.confirm}>
              <div className={styles["rx-input-wrap"]}>
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={form.confirm}
                  onChange={set("confirm")}
                  className={errors.confirm ? styles.err : ""}
                />
                <span className={styles["rx-eye"]} onClick={() => setShowConfirm((v) => !v)}>{showConfirm ? "🙈" : "👁"}</span>
              </div>
            </Field>
            <div className={styles["rx-spacer"]} />

            {serverError && (
              <p style={{ color: "#ff5757", marginTop: "12px", fontSize: "14px" }}>
                ⚠ {serverError}
              </p>
            )}

            <div className={styles["rx-btn-row"]}>
              <button className={`${styles["rx-btn"]} ${styles["rx-btn-secondary"]}`} onClick={prev} disabled={loading}>← Back</button>

              <button className={`${styles["rx-btn"]} ${styles["rx-btn-primary"]}`} onClick={submit} disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

function Field({ label, error, hint, children, styles }) {
  return (
    <div className={styles["rx-field"]}>
      <label className={styles["rx-label"]}>{label}</label>
      {children}
      {hint && !error && <span className={styles["rx-hint"]}>{hint}</span>}
      {error && <span className={styles["rx-error"]}>{error}</span>}
    </div>
  );
}