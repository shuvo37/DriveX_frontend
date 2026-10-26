import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./CarAssistant.css";

// Floating chat box for customers. It sends one question at a time to POST /api/ai/ask
// and shows the answer. The backend answers from the real DriveX car list.
function CarAssistant() {
  const [open, setOpen] = useState(false);          // is the chat panel visible?
  const [question, setQuestion] = useState("");      // what the user is typing
  const [loading, setLoading] = useState(false);     // waiting for the answer?
  const [messages, setMessages] = useState([
    { from: "ai", text: "Hi! Ask me about our cars: prices, seats, fuel, cities or what is available." },
  ]);
  const bottomRef = useRef(null);                    // an empty div at the end of the list

  // Scroll to the newest message whenever the list changes.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = question.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { from: "user", text }]);
    setQuestion("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:8080/api/ai/ask", { question: text });
      setMessages((prev) => [...prev, { from: "ai", text: response.data.answer }]);
    } catch (err) {
      const data = err.response?.data;
      const message =
        data?.message ||                       // for example "The assistant is busy right now..."
        data?.errors?.question ||              // validation, for example "Question is too long"
        "I couldn't connect just now, but I can help with cars, prices and booking. Please try again in a moment.";
      setMessages((prev) => [...prev, { from: "ai", text: message, error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") send();
  };

  return (
    <div className="assistant">
      {open && (
        <div className="assistant-panel">
          <div className="assistant-header">
            <span>DriveX Assistant</span>
            <button className="assistant-close" onClick={() => setOpen(false)} aria-label="Close">
              ×
            </button>
          </div>

          <div className="assistant-messages">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`assistant-msg ${m.from === "user" ? "assistant-user" : "assistant-ai"} ${m.error ? "assistant-error" : ""}`}
              >
                {m.text}
              </div>
            ))}
            {loading && <div className="assistant-msg assistant-ai">Thinking...</div>}
            <div ref={bottomRef} />
          </div>

          <div className="assistant-input">
            <input
              type="text"
              value={question}
              maxLength={500}
              placeholder="Ask about our cars..."
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button onClick={send} disabled={loading || !question.trim()}>
              Send
            </button>
          </div>
        </div>
      )}

      <button className="assistant-toggle" onClick={() => setOpen((o) => !o)} aria-label="Open assistant">
        {open ? "×" : "💬"}
      </button>
    </div>
  );
}

export default CarAssistant;
