import { useState } from "react";

function RiskQuestion({ question, options, onAnswer }) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleSelect = (score, index) => {
    setSelectedIndex(index);
    onAnswer(score);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">{question}</h3>

      <div className="space-y-2">
        {options.map((opt, index) => {
          const isSelected = selectedIndex === index;

          return (
            <button
              key={index}
              onClick={() => handleSelect(opt.score, index)}
              className={`w-full text-left px-4 py-3 rounded border transition
                ${
                  isSelected
                    ? "bg-purple-600 text-white border-purple-600"
                    : "hover:bg-purple-100 border-gray-300"
                }
              `}
            >
              {opt.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default RiskQuestion;
