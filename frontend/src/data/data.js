export const riskQuestions = [
  {
    id: 1,
    question: "If your investment portfolio lost 20% of its value in a year, what would you do?",
    options: [
      { label: "Sell immediately to avoid further losses", score: 2 },
      { label: "Hold and wait for recovery", score: 4 },
      { label: "Invest more to take advantage of lower prices", score: 6 }
    ]
  },
  {
    id: 2,
    question: "How long do you plan to invest before you need the money?",
    options: [
      { label: "Less than 1 year", score: 2 },
      { label: "1-3 years", score: 4 },
      { label: "More than 3 years", score: 6 }
    ]
  },
  {
    id: 3,
    question: "Which statement best describes your investment philosophy?",
    options: [
      { label: "I prefer safe, stable returns", score: 2 },
      { label: "I prefer a balanced approach", score: 4 },
      { label: "I prefer high-risk, high-reward opportunities", score: 6 }
    ]
  },
  {
    id: 4,
    question: "How familiar are you with investing?",
    options: [
      { label: "Beginner", score: 2 },
      { label: "Moderately experienced", score: 4 },
      { label: "Highly experienced", score: 6 }
    ]
  },
  {
    id: 5,
    question: "What level of risk are you comfortable with?",
    options: [
      { label: "Up to 5% loss", score: 2 },
      { label: "5%-15% loss", score: 4 },
      { label: "More than 15% loss", score: 6 }
    ]
  }
];
