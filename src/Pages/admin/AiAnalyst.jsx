import { useEffect, useRef, useState } from "react";
import axios from "axios";
import styles from "./CSS/AiAnalyst.module.css";

// Ready-made questions the admin can click instead of typing.
const EXAMPLES = [
  "Which rentals are late right now and how much fine is owed?",
  "Which cars earned the most in the last 30 days?",
  "Which cars are rented least? Should any be put into maintenance or removed?",
  "Compare rental income and fine income this month.",
];

// Admin page: ask the AI analyst a business question. The backend lets the AI read the live
// database through read-only tools, then returns its analysis and the list of data it looked at.
function AiAnalyst() {
  const [question, setQuestion] = useState("");   // text in the input box
  const [loading, setLoading] = useState(false);  // waiting for the analysis?
  const [chat, setChat] = useState([]);           // [{ question, answer, tools, error }]
  const bottomRef = useRef(null);                 // empty div at the end, used for auto-scroll

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  const ask = async (text) => {
    const q = (text ?? question).trim();
    if (!q || loading) return;

    setQuestion("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:8080/api/ai/analyst", { question: q });
      setChat((prev) => [...prev, { question: q, answer: res.data.answer, tools: res.data.toolsUsed }]);
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      let message = data?.message || data?.errors?.question || "Could not reach the analyst. Please try again.";
      if (status === 401 || status === 403) {
        message = "Only an ADMIN can use the analyst. Please log in as ADMIN.";
      }
      setChat((prev) => [...prev, { question: q, error: message }]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask();
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h3>🤖 AI Analyst</h3>
        <p className={styles.sub}>
          Ask about your fleet, bookings, late returns and income. The AI reads your live data, analyses it
          and recommends what to do. It cannot change anything.
        </p>

        {chat.length === 0 && (
          <div className={styles.examples}>
            {EXAMPLES.map((ex) => (
              <button key={ex} className={styles.chip} onClick={() => ask(ex)} disabled={loading}>
                {ex}
              </button>
            ))}
          </div>
        )}

        <div className={styles.thread}>
          {chat.map((m, i) => (
            <div key={i} className={styles.turn}>
              <div className={styles.q}>{m.question}</div>
              {m.error ? (
                <div className={`${styles.a} ${styles.err}`}>{m.error}</div>
              ) : (
                <div className={styles.a}>
                  {m.answer}
                  {m.tools?.length > 0 && (
                    <div className={styles.tools}>
                      Data read: {m.tools.join(", ")}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {loading && <div className={`${styles.a} ${styles.thinking}`}>Analysing your data...</div>}
          <div ref={bottomRef} />
        </div>

        <div className={styles.inputRow}>
          <textarea
            rows={2}
            maxLength={500}
            value={question}
            placeholder="Ask a question about your business..."
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button onClick={() => ask()} disabled={loading || !question.trim()}>
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}

export default AiAnalyst;
