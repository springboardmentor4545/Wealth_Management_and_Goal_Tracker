import { useState } from "react";

function RiskQuestion({ question, options, onAnswer }) {
  const [selectedOptionId, setSelectedOptionId] = useState(null);

  const handleSelect = (optionId) => {
    setSelectedOptionId(optionId);
    onAnswer(optionId);
  };

  return (
    <div>
      <h3 className="text-[18px] font-semibold text-[#111827] mb-3">
        {question}
      </h3>

      {options.map((opt) => (
        <button
          key={opt.option_id}
          onClick={() => handleSelect(opt.option_id)}
          className={`block w-full mb-2 px-4 h-[44px] rounded-2xl text-left transition
            bg-[#F9FAFB] border border-[#E5E7EB] text-[#2B2B2B] hover:bg-[#EEF2FF] hover:border-[#4C8DFF]
            transition-[transform,background-color,border-color] duration-200
            ${selectedOptionId === opt.option_id ? "bg-[#EEF2FF] border-2 border-[#4C8DFF] text-[#1E3A8A] scale-[1.01]" : ""}
          `}
        >
          {opt.text}
        </button>
      ))}
    </div>
  );
}

export default RiskQuestion;
