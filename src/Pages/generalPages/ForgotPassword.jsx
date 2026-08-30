import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./CSS/ForgotPassword.module.css";
import { getBlockedUntil, setBlockedUntil, clearBlockedUntil, isBlocked, formatBlockCountdown } from "../../utils/blockStorage";

const STEP_ORDER = { email: 1, code: 2, reset: 3, notfound: 1, success: 4 };
const CODE_LENGTH = 4;

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);

  const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
  const [codeErr, setCodeErr] = useState("");
  const [loadingCode, setLoadingCode] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const codeRefs = useRef([]);

  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [matchErr, setMatchErr] = useState("");
  const [strengthScore, setStrengthScore] = useState(0);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  // ── Block state: per-email, looked up/stored via blockStorage.js ──
  const [blockedUntilState, setBlockedUntilState] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const blocked = isBlocked(blockedUntilState, now);
  const blockMmss = formatBlockCountdown(blockedUntilState, now);

  // keeps state and localStorage in sync for a specific email, in one place
  const applyBlockedUntil = (emailValue, value) => {
    if (value) {
      setBlockedUntil(emailValue, value);
      setBlockedUntilState(value);
    } else {
      clearBlockedUntil(emailValue);
      setBlockedUntilState(null);
    }
  };

  const fillWidths = { 1: "0%", 2: "33.3%", 3: "66.6%", 4: "100%" };
  const currentIgnitionStep = STEP_ORDER[step] || 1;

  useEffect(() => {
    if (step !== "code" || !expiresAt) return;
    
    const tick = () => {
      const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSecondsLeft(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [step, expiresAt]);

  const isCodeExpired = step === "code" && expiresAt !== null && secondsLeft <= 0;
  const mmss = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // ── Step 1: check email ──
  const handleCheckEmail = async () => {
    setEmailErr("");
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setEmailErr("Enter a valid email address");
      return;
    }

    // check locally first — avoids hitting the backend if already known-blocked for this email
    const existingBlock = getBlockedUntil(trimmed);

    console.log("existing block " , existingBlock);


    if (existingBlock) {
      setBlockedUntilState(existingBlock);
      setEmailErr("Too many attempts — please try again later.");
      return;
    }

    setLoadingEmail(true);

    try {
      const res = await axios.post("http://localhost:8080/api/auth/forgot-password/check-email", {
        email: trimmed,
      });
      const { exists, hasPassword, expiresAt: expiry, blockUntill} = res.data;

      console.log("data " , res.data);

      console.log("until " , blockUntill);



      if (blockUntill) {
        applyBlockedUntil(trimmed, blockUntill);
        setEmailErr("Too many attempts — please try again later.");
        return;
      }

      if (!exists || !hasPassword) {
        setStep("notfound");
      } else {
        setCode(Array(CODE_LENGTH).fill(""));
        setExpiresAt(expiry);
        setStep("code");
      }
    } catch (err) {
      if (err.response) {
        setEmailErr(err.response.data?.message || "Something went wrong");
      } else {
        setEmailErr("Network error — try again");
      }
    } finally {
      setLoadingEmail(false);
    }
  };

  // ── Step 2: 4-digit code ──
  const handleCodeChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...code];
    next[index] = value;
    setCode(next);
    setCodeErr("");

    if (value && index < CODE_LENGTH - 1) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e) => {
    const pasted = e.clipboardData.getData("text").trim();
    if (!/^[0-9]+$/.test(pasted)) return;
    e.preventDefault();
    const digits = pasted.slice(0, CODE_LENGTH).split("");
    const next = Array(CODE_LENGTH).fill("");
    digits.forEach((d, i) => (next[i] = d));
    setCode(next);
    codeRefs.current[Math.min(digits.length, CODE_LENGTH) - 1]?.focus();
  };

  const handleVerifyCode = async () => {
    const joined = code.join("");
    if (joined.length !== CODE_LENGTH) {
      setCodeErr(`Enter all ${CODE_LENGTH} digits`);
      return;
    }
    if (isCodeExpired) {
      setCodeErr("This code has expired — request a new one");
      return;
    }

    setLoadingCode(true);
    try {
      const res = await axios.post("http://localhost:8080/api/auth/forgot-password/verify-code", {
        email: email.trim(),
        code: joined,
      });

      if (res.data === true) {
        setStep("reset");
      } else {
        setCodeErr("Incorrect code — please try again");
      }
    } catch (err) {
      setCodeErr(err.response?.data?.message || "Something went wrong — please try again");
    } finally {
      setLoadingCode(false);
    }
  };

  const handleResendCode = async () => {
    setCodeErr("");

    // check locally first, same as check-email
    const existingBlock = getBlockedUntil(email.trim());
    if (existingBlock) {
      setBlockedUntilState(existingBlock);
      setCodeErr("Too many attempts — please try again later.");
      return;
    }

    setLoadingResend(true);
    try {
      const res = await axios.post("http://localhost:8080/api/auth/forgot-password/resend-code", {
        email: email.trim(),
      });

      if (res.data.blockedUntil) {
        applyBlockedUntil(email.trim(), res.data.blockedUntil);
        setCodeErr("Too many attempts — please try again later.");
        return;
      }

      setCode(Array(CODE_LENGTH).fill(""));
      setExpiresAt(res.data.expiresAt);
      codeRefs.current[0]?.focus();
    } catch (err) {
      setCodeErr(err.response?.data?.message || "Couldn't resend — try again shortly");
    } finally {
      setLoadingResend(false);
    }
  };

  // ── Step 3: set new password ──
  const computeStrength = (val) => {
    let score = 0;
    if (val.length >= 8) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
    return score;
  };

  const handleNewPassChange = (val) => {
    setNewPass(val);
    setStrengthScore(computeStrength(val));
    if (confirmPass) {
      setMatchErr(val !== confirmPass ? "Passwords don't match" : "");
    }
  };

  const handleConfirmPassChange = (val) => {
    setConfirmPass(val);
    setMatchErr(val && newPass !== val ? "Passwords don't match" : "");
  };

  const strengthColors = ["#e5595c", "#e5595c", "#f2c94c", "#b7c65a"];
  const strengthLabels = ["Too short", "Weak", "Good", "Strong"];
  const strengthHint =
    newPass.length === 0
      ? "At least 8 characters, one number, one symbol"
      : strengthLabels[Math.max(strengthScore - 1, 0)];

  const handleReset = async () => {
    if (newPass.length < 8) return;
    if (newPass !== confirmPass) {
      setMatchErr("Passwords don't match");
      return;
    }

    setLoadingReset(true);
    try {
      await axios.post("http://localhost:8080/api/auth/forgot-password/reset", {
        email: email.trim(),
        code: code.join(""),
        newPassword: newPass,
      });
      setStep("success");
    } catch (err) {
      setMatchErr(err.response?.data?.message || "Couldn't update password — try again");
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <div className={styles.brand}>
          <span className={styles.brandDrive}>Drive</span>
          <span className={styles.brandX}>X</span>
        </div>

        <Ignition currentStep={currentIgnitionStep} fillWidths={fillWidths} />

        <div className={styles.card}>
          {step === "email" && (
            <EmailStep
              email={email}
              setEmail={setEmail}
              emailErr={emailErr}
              loading={loadingEmail}
              blocked={blocked}
              blockMmss={blockMmss}
              onSubmit={handleCheckEmail}
            />
          )}

          {step === "code" && (
            <CodeStep
              email={email}
              code={code}
              codeErr={codeErr}
              loading={loadingCode}
              loadingResend={loadingResend}
              secondsLeft={secondsLeft}
              mmss={mmss}
              isCodeExpired={isCodeExpired}
              blocked={blocked}
              blockMmss={blockMmss}
              codeRefs={codeRefs}
              onChange={handleCodeChange}
              onKeyDown={handleCodeKeyDown}
              onPaste={handleCodePaste}
              onVerify={handleVerifyCode}
              onResend={handleResendCode}
              onBack={() => setStep("email")}
            />
          )}

          {step === "reset" && (
            <ResetStep
              email={email}
              newPass={newPass}
              confirmPass={confirmPass}
              matchErr={matchErr}
              strengthScore={strengthScore}
              strengthHint={strengthHint}
              strengthColors={strengthColors}
              showNewPass={showNewPass}
              showConfirmPass={showConfirmPass}
              loading={loadingReset}
              onNewPassChange={handleNewPassChange}
              onConfirmPassChange={handleConfirmPassChange}
              onToggleNewPass={() => setShowNewPass((v) => !v)}
              onToggleConfirmPass={() => setShowConfirmPass((v) => !v)}
              onSubmit={handleReset}
              onBack={() => setStep("code")}
            />
          )}

          {step === "notfound" && <NotFoundStep email={email} onBack={() => setStep("email")} />}

          {step === "success" && <SuccessStep onDone={() => navigate("/")} />}
        </div>

        {step !== "success" && (
          <div className={styles.footerNote}>
            Remembered it after all? <a href="/">Sign in</a>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Ignition stepper ── */
function Ignition({ currentStep, fillWidths }) {
  const nodeClass = (n) => {
    if (n < currentStep) return styles.ignNodeDone;
    if (n === currentStep) return styles.ignNodeActive;
    return styles.ignNode;
  };
  const labelClass = (n) => (n <= currentStep ? styles.ignLabelLit : styles.ignLabel);

  return (
    <div className={styles.ignition}>
      <div className={styles.ignTrack}>
        <div className={styles.ignLine}></div>
        <div className={styles.ignLineFill} style={{ width: fillWidths[currentStep] }}></div>

        <div className={styles.ignNodeWrap}>
          <div className={nodeClass(1)}>1</div>
          <span className={labelClass(1)}>Verify</span>
        </div>
        <div className={styles.ignNodeWrap}>
          <div className={nodeClass(2)}>2</div>
          <span className={labelClass(2)}>Code</span>
        </div>
        <div className={styles.ignNodeWrap}>
          <div className={nodeClass(3)}>3</div>
          <span className={labelClass(3)}>Reset</span>
        </div>
        <div className={styles.ignNodeWrap}>
          <div className={nodeClass(4)}>
            <svg
              className={styles.keyIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="8" cy="15" r="4" />
              <path d="M10.85 12.15 19 4M19 4h-4M19 4v4" />
            </svg>
          </div>
          <span className={labelClass(4)}>Done</span>
        </div>
      </div>
    </div>
  );
}

/* ── Step 1: email ── */
function EmailStep({ email, setEmail, emailErr, loading, blocked, blockMmss, onSubmit }) {
  return (
    <div className={styles.step}>
      <h1 className={styles.heading}>
        Reset your <span className={styles.accent}>password</span>
      </h1>
      <p className={styles.sub}>
        Enter the email on your account. We'll check how you originally signed in and take you from there.
      </p>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          type="email"
          className={emailErr ? styles.inputErr : styles.input}
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        />
        {emailErr && <div className={styles.errMsg}>{emailErr}</div>}

        {blocked && (
          <div className={styles.errMsg}>
            Too many attempts. Try again in {blockMmss}.
          </div>
        )}
      </div>

      <button className={styles.primaryBtn} disabled={loading || blocked} onClick={onSubmit}>
        <span className={loading ? styles.btnTextHidden : ""}>Continue</span>
        {loading && <div className={styles.spinner}></div>}
      </button>
    </div>
  );
}

/* ── Step 2: 4-digit code ── */
function CodeStep({
  email,
  code,
  codeErr,
  loading,
  loadingResend,
  secondsLeft,
  mmss,
  isCodeExpired,
  blocked,
  blockMmss,
  codeRefs,
  onChange,
  onKeyDown,
  onPaste,
  onVerify,
  onResend,
  onBack,
}) {
  return (
    <div className={styles.step}>
      <button className={styles.backLink} onClick={onBack}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back
      </button>

      <h1 className={styles.heading}>
        Enter the <span className={styles.accent}>code</span>
      </h1>
      <p className={styles.sub}>
        We sent a 4-digit code to <span className={styles.subStrong}>{email}</span>.{" "}
        {isCodeExpired ? (
          <span style={{ color: "var(--danger)" }}>It has expired — request a new one below.</span>
        ) : (
          <>
            It expires in <span className={styles.subStrong}>{mmss}</span>.
          </>
        )}
      </p>

      <div className={styles.otpRow} onPaste={onPaste}>
        {code.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (codeRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            disabled={isCodeExpired || blocked}
            className={codeErr ? styles.otpBoxErr : styles.otpBox}
            value={digit}
            onChange={(e) => onChange(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
          />
        ))}
      </div>
      {codeErr && (
        <div className={styles.errMsg} style={{ justifyContent: "center" }}>
          {codeErr}
        </div>
      )}
      {blocked && (
        <div className={styles.errMsg} style={{ justifyContent: "center" }}>
          Too many attempts. Try again in {blockMmss}.
        </div>
      )}

      <div className={styles.resendRow}>
        Didn't get it?{" "}
        <button className={styles.resendLink} onClick={onResend} disabled={loadingResend || blocked}>
          {loadingResend ? "Sending…" : "Resend code"}
        </button>
      </div>

      <button
        className={styles.primaryBtn}
        disabled={loading || isCodeExpired || blocked}
        onClick={onVerify}
        style={{ marginTop: 22 }}
      >
        <span className={loading ? styles.btnTextHidden : ""}>Verify code</span>
        {loading && <div className={styles.spinner}></div>}
      </button>
    </div>
  );
}

/* ── Step 3: reset password ── */
function ResetStep({
  email,
  newPass,
  confirmPass,
  matchErr,
  strengthScore,
  strengthHint,
  strengthColors,
  showNewPass,
  showConfirmPass,
  loading,
  onNewPassChange,
  onConfirmPassChange,
  onToggleNewPass,
  onToggleConfirmPass,
  onSubmit,
  onBack,
}) {
  return (
    <div className={styles.step}>
      <button className={styles.backLink} onClick={onBack}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back
      </button>

      <h1 className={styles.heading}>
        Set a <span className={styles.accent}>new password</span>
      </h1>
      <p className={styles.sub}>
        Choose a new password for <span className={styles.subStrong}>{email}</span>.
      </p>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="newPass">
          New password
        </label>
        <div className={styles.inputShell}>
          <input
            id="newPass"
            type={showNewPass ? "text" : "password"}
            className={styles.input}
            placeholder="Enter new password"
            value={newPass}
            onChange={(e) => onNewPassChange(e.target.value)}
          />
          <button type="button" className={styles.toggleEye} onClick={onToggleNewPass}>
            <EyeIcon />
          </button>
        </div>
        <div className={styles.strength}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={styles.strengthBar}
              style={{ background: i < strengthScore ? strengthColors[strengthScore - 1] : undefined }}
            ></div>
          ))}
        </div>
        <div className={styles.hint}>{strengthHint}</div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="confirmPass">
          Confirm password
        </label>
        <div className={styles.inputShell}>
          <input
            id="confirmPass"
            type={showConfirmPass ? "text" : "password"}
            className={matchErr ? styles.inputErr : styles.input}
            placeholder="Re-enter new password"
            value={confirmPass}
            onChange={(e) => onConfirmPassChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          />
          <button type="button" className={styles.toggleEye} onClick={onToggleConfirmPass}>
            <EyeIcon />
          </button>
        </div>
        {matchErr && <div className={styles.errMsg}>{matchErr}</div>}
      </div>

      <button className={styles.primaryBtn} disabled={loading} onClick={onSubmit}>
        <span className={loading ? styles.btnTextHidden : ""}>Update password</span>
        {loading && <div className={styles.spinner}></div>}
      </button>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/* ── Not found ── */
function NotFoundStep({ email, onBack }) {
  return (
    <div className={styles.step}>
      <div className={styles.iconBadgeWarn}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e5595c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v5M12 16h.01" />
        </svg>
      </div>
      <h1 className={styles.heading}>
        No account <span className={styles.accent}>found</span>
      </h1>
      <p className={styles.sub}>
        We couldn't find a DriveX account for <span className={styles.subStrong}>{email}</span>. Double-check the
        address, or create a new account.
      </p>

      <button className={styles.backLink} style={{ marginBottom: 0 }} onClick={onBack}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Try a different email
      </button>

      <div className={styles.footerNote} style={{ marginTop: 22 }}>
        Don't have an account? <a href="/signup">Create one</a>
      </div>
    </div>
  );
}

/* ── Success ── */
function SuccessStep({ onDone }) {
  return (
    <div className={styles.step}>
      <div className={styles.iconBadgeOk}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b7c65a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h1 className={styles.heading}>
        Password <span className={styles.accent}>updated</span>
      </h1>
      <p className={styles.sub}>
        You're all set. Sign in with your new password to get back to managing your bookings.
      </p>

      <button className={styles.primaryBtn} onClick={onDone}>
        Back to sign in
      </button>
    </div>
  );
}