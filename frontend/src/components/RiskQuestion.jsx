import { useState } from "react";
import RiskQuestion from "../components/RiskQuestion";

function RiskProfile() {
  const [totalScore, setTotalScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const questions = [
    {
      question: "How do you react to market volatility?",
      options: [
        { label: "I avoid risk completely", score: 2 },
        { label: "I wait and watch", score: 4 },
        { label: "I invest more", score: 6 },
      ],
    },
    {
      question: "What is your investment horizon?",
      options: [
        { label: "Less than 1 year", score: 2 },
        { label: "1–3 years", score: 4 },
        { label: "More than 5 years", score: 6 },
      ],
    },
    {
      question: "How familiar are you with investments?",
      options: [
        { label: "Beginner", score: 2 },
        { label: "Intermediate", score: 4 },
        { label: "Expert", score: 6 },
      ],
    },
  ];

  const getRiskType = () => {
    if (totalScore <= 10) return "Conservative";
    if (totalScore <= 18) return "Moderate";
    return "Aggressive";
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h2 className="text-3xl font-bold text-center mb-6">
        Risk Profiling
      </h2>

      {!submitted ? (
        <>
          {questions.map((q, index) => (
            <RiskQuestion
              key={index}
              question={q.question}
              options={q.options}
              onAnswer={(score) =>
                setTotalScore((prev) => prev + score)
              }
            />
          ))}

          <button
            onClick={() => setSubmitted(true)}
            className="block mx-auto mt-6 bg-purple-600 text-white px-6 py-2 rounded-lg"
          >
            Submit
          </button>
        </>
      ) : (
        <div className="text-center mt-10">
          <h3 className="text-xl font-semibold">
            Your Risk Profile:
          </h3>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {getRiskType()}
          </p>
        </div>
      )}
    </div>
  );
}

export default RiskProfile;
