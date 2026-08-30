import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate, useSearchParams } from "react-router-dom"
import { saveToken } from "../../utils/tokenUtils"
import "./CompleteProfile.css"

function CompleteProfile() {
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const t = searchParams.get("token")

    if (!t) {
      navigate("/login")
      return
    }

    setToken(t)
    saveToken(t)
  }, [])

  function isValidPhone(value) {
    return /^[0-9]{10,11}$/.test(value)
  }

  async function handleSubmit() {
    if (!isValidPhone(phone)) {
      setError("Enter a valid 10–11 digit phone number.")
      return
    }

    setError("")
    setLoading(true)

    try {
      await axios.post(
        "http://localhost:8080/api/auth/complete-profile",
        { phoneNumber: phone },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      navigate("/user/dashboard")
    } catch (err) {
      console.log(err.response?.status)
      console.log(err.response?.data)

      setError(err.response?.data?.message || "Couldn't save your number. Try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSubmit()
  }

  return (
    <div className="cp-screen">
      <div className="cp-glow" />

      <div className="cp-card">
        <span className="cp-eyebrow">STEP 1 · PROFILE</span>

        <h1 className="cp-title">Complete your profile</h1>
        <p className="cp-subtitle">
          One last detail before we hand you the keys.
        </p>

        <label className="cp-label" htmlFor="phone">
          Phone number
        </label>

        <div className={`cp-input-wrap ${error ? "cp-input-wrap--error" : ""}`}>
          <svg className="cp-input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M6.6 10.8c1.2 2.4 3.2 4.4 5.6 5.6l1.9-1.9c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V19.5c0 .6-.4 1-1 1C10.4 20.5 3.5 13.6 3.5 5.4c0-.6.4-1 1-1H7.6c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.3 0 .7-.2 1L6.6 10.8Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>

          <input
            id="phone"
            inputMode="numeric"
            placeholder="e.g. 01712345678"
            value={phone}
            onKeyDown={handleKeyDown}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
          />
        </div>

        {error && <p className="cp-error">{error}</p>}

        <button
          className="cp-button"
          onClick={handleSubmit}
          disabled={loading}
        >
          <span className="cp-button-ring" />
          {loading ? "Saving…" : "Continue to dashboard"}
        </button>
      </div>
    </div>
  )
}

export default CompleteProfile
