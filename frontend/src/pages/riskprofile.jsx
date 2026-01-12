import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function RiskProfile() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/v1/auth/risk-profile/questions")
      .then(res => setQuestions(res.data))
      .catch(err => console.log(err));
  }, []);

  const handleSelect = (qid, score) => {
    setAnswers(prev => ({ ...prev, [qid]: score }));
  };

  const handleSubmit = async () => {
    try {
      await axios.post(
        "http://127.0.0.1:8000/api/v1/auth/risk-profile/submit",
        { answers },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      navigate("/kyc");
    } catch (err) {
      console.error(err.response?.data);
      alert(JSON.stringify(err.response?.data, null, 2));
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Risk Profiling</h2>

      {questions.map(q => (
        <div key={q.id} className="mb-4">
          <p className="font-semibold">{q.question}</p>
          {q.options.map((opt, i) => (
            <label key={i} className="block">
              <input
                type="radio"
                name={`q${q.id}`}
                onChange={() => handleSelect(q.id, opt.score)}
              />{" "}
              {opt.text}
            </label>
          ))}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
      >
        Submit Risk Profile
      </button>
    </div>
  );
}
