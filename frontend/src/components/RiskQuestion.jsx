import { useState } from "react";

function RiskQuestion({ question, options, onAnswer }) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleSelect = (score, index) => {
    if (selectedIndex === null) {
      setSelectedIndex(index);
      onAnswer(score); // Person-3 will handle this
    }
  };

  return (
    <div className="bg-white p-4 mb-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-3">{question}</h3>

      <div className="space-y-2">
        {options.map((opt, index) => {
          const isSelected = selectedIndex === index;

          return (
            <button
              key={index}
              onClick={() => handleSelect(opt.score, index)}
              disabled={selectedIndex !== null}
              className={`w-full text-left px-4 py-2 rounded border transition
                ${
                  isSelected
                    ? "bg-purple-600 text-white border-purple-600"
                    : "hover:bg-purple-100"
                }
                ${selectedIndex !== null && !isSelected ? "opacity-50" : ""}
              `}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default RiskQuestion;
