'use client';

import { useEffect, useMemo, useState } from "react";
import examData from "@/data/enade-data.json";

type Question = {
  number: number;
  correct: string;
};

type Exam = {
  id: string;
  year: number;
  name: string;
  questions: Question[];
  provaPdf: string;
  gabaritoPdf: string;
};

const OPTIONS = ["A", "B", "C", "D", "E"];
const examList = examData as Exam[];

function buildEmptyAnswers(questions: Question[]) {
  return Object.fromEntries(questions.map((question) => [question.number, ""])) as Record<number, string>;
}

export default function Home() {
  const [selectedExamId, setSelectedExamId] = useState<string>(examList[0]?.id ?? "");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [validated, setValidated] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const exam = useMemo(
    () => examList.find((item) => item.id === selectedExamId) ?? examList[0],
    [selectedExamId],
  );

  useEffect(() => {
    if (!exam) return;
    setAnswers(buildEmptyAnswers(exam.questions));
    setValidated(false);
    setShowKey(false);
  }, [exam]);

  if (!exam) {
    return <main className="page-shell">Nenhuma prova disponível no momento.</main>;
  }

  const totalQuestions = exam.questions.length;
  const correctCount = exam.questions.reduce(
    (count, question) => count + (answers[question.number] === question.correct ? 1 : 0),
    0,
  );
  const unansweredCount = exam.questions.reduce(
    (count, question) => count + (!answers[question.number] ? 1 : 0),
    0,
  );
  const incorrectCount = totalQuestions - correctCount - unansweredCount;
  const score = totalQuestions ? (correctCount / totalQuestions) * 100 : 0;

  const handleAnswer = (questionNumber: number, value: string) => {
    setAnswers((current) => ({ ...current, [questionNumber]: value }));
  };

  return (
    <main className="page-shell">
      <div className="app-card">
        <header className="topbar">
          <div>
            <p className="eyebrow">ENADE · Simulado de questões objetivas</p>
            <h1>Sistema de prova objetiva</h1>
          </div>
          <button type="button" className="ghost-button" onClick={() => setShowKey((value) => !value)}>
            {showKey ? "Ocultar gabarito" : "Ver gabarito"}
          </button>
        </header>

        <section className="selector-panel">
          <label className="label-block" htmlFor="exam-select">
            Prova disponível
          </label>
          <select
            id="exam-select"
            value={selectedExamId}
            onChange={(event) => setSelectedExamId(event.target.value)}
          >
            {examList.map((item) => (
              <option key={item.id} value={item.id}>
                {item.year} · {item.name}
              </option>
            ))}
          </select>
        </section>

        <section className="summary-grid">
          <div className="summary-card positive">
            <span>Acertos</span>
            <strong>{correctCount}</strong>
          </div>
          <div className="summary-card negative">
            <span>Erros</span>
            <strong>{incorrectCount}</strong>
          </div>
          <div className="summary-card neutral">
            <span>Sem resposta</span>
            <strong>{unansweredCount}</strong>
          </div>
          <div className="summary-card neutral">
            <span>Desempenho</span>
            <strong>{score.toFixed(0)}%</strong>
          </div>
        </section>

        <div className="action-row">
          <button type="button" className="primary-button" onClick={() => setValidated(true)}>
            Validar respostas
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setAnswers(buildEmptyAnswers(exam.questions));
              setValidated(false);
              setShowKey(false);
            }}
          >
            Limpar respostas
          </button>
        </div>

        {validated && (
          <div className="result-banner" role="status">
            Você acertou {correctCount} de {totalQuestions} questões objetivas.
          </div>
        )}

        <section className="quiz-grid">
          {exam.questions.map((question) => {
            const selectedValue = answers[question.number] ?? "";
            const isCorrect = validated && selectedValue === question.correct;
            const isIncorrect = validated && selectedValue && selectedValue !== question.correct;

            return (
              <article
                key={question.number}
                className={`question-card ${isCorrect ? "question-card-correct" : ""} ${
                  isIncorrect ? "question-card-incorrect" : ""
                }`}
              >
                <div className="question-header">
                  <span className="question-index">Questão {question.number}</span>
                  {validated && (
                    <span className="status-label">
                      {selectedValue === question.correct ? "Acertou" : selectedValue ? "Errou" : "Sem resposta"}
                    </span>
                  )}
                </div>

                <p className="question-instruction">Selecione a alternativa correta.</p>

                <div className="options-grid">
                  {OPTIONS.map((option) => {
                    const isSelected = selectedValue === option;
                    const isRightAnswer = showKey && option === question.correct;
                    const isWrongSelection = validated && isSelected && option !== question.correct;

                    return (
                      <label
                        key={`${question.number}-${option}`}
                        className={[
                          "option-item",
                          isSelected ? "selected" : "",
                          isRightAnswer ? "correct-answer" : "",
                          isWrongSelection ? "wrong-answer" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <input
                          type="radio"
                          name={`question-${question.number}`}
                          value={option}
                          checked={isSelected}
                          onChange={() => handleAnswer(question.number, option)}
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>

                {showKey && (
                  <div className="answer-key">
                    Gabarito: <strong>{question.correct}</strong>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
