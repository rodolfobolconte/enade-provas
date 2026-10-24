'use client';

import { useEffect, useMemo, useRef, useState } from "react";
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
  const [pdfWidth, setPdfWidth] = useState(68);
  const [statsHeight, setStatsHeight] = useState(210);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const rightPanelRef = useRef<HTMLElement | null>(null);

  const dragRef = useRef<{
    type: "vertical" | "horizontal";
    startX: number;
    startY: number;
    startPdfWidth: number;
    startStatsHeight: number;
  } | null>(null);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (!dragRef.current) return;

      if (dragRef.current.type === "vertical") {
        const containerWidth = workspaceRef.current?.clientWidth ?? 1200;
        const deltaPercent = (event.clientX - dragRef.current.startX) / containerWidth;
        const nextWidth = dragRef.current.startPdfWidth + deltaPercent * 100;
        setPdfWidth(Math.min(Math.max(nextWidth, 35), 80));
      }

      if (dragRef.current.type === "horizontal") {
        const containerHeight = rightPanelRef.current?.clientHeight ?? 700;
        const deltaPx = event.clientY - dragRef.current.startY;
        const nextHeight = dragRef.current.startStatsHeight + deltaPx;
        setStatsHeight(Math.min(Math.max(nextHeight, 120), containerHeight - 180));
      }
    };

    const onMouseUp = () => {
      dragRef.current = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

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

  const fileName = exam.provaPdf.split(/[\\/]/).pop() ?? "";
  const pdfUrl = fileName ? `/provas/${fileName}` : "";

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

  const startVerticalResize = (event: React.MouseEvent<HTMLDivElement>) => {
    dragRef.current = {
      type: "vertical",
      startX: event.clientX,
      startY: event.clientY,
      startPdfWidth: pdfWidth,
      startStatsHeight: statsHeight,
    };
  };

  const startHorizontalResize = (event: React.MouseEvent<HTMLDivElement>) => {
    dragRef.current = {
      type: "horizontal",
      startX: event.clientX,
      startY: event.clientY,
      startPdfWidth: pdfWidth,
      startStatsHeight: statsHeight,
    };
  };

  return (
    <main className="page-shell">
      <div className="workspace-shell" ref={workspaceRef}>
        <aside className="pdf-panel" style={{ width: `${pdfWidth}%` }}>
          <div className="panel-header">
            <div>
              <p className="eyebrow">Prova</p>
              <h2>{exam.year} · {exam.name}</h2>
            </div>
          </div>

          <div className="pdf-frame">
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                title={`Prova ${exam.name}`}
                className="pdf-viewer"
              />
            ) : (
              <div className="pdf-placeholder">PDF não disponível.</div>
            )}
          </div>
        </aside>

        <div
          className="splitter vertical"
          onMouseDown={startVerticalResize}
          aria-label="Redimensionar prova e quiz"
        />

        <section className="quiz-panel" ref={rightPanelRef}>
          <div className="stats-panel" style={{ height: `${statsHeight}px` }}>
            <div className="quiz-panel-header">
              <div className="selector-wrap">
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
              </div>

              <button type="button" className="ghost-button" onClick={() => setShowKey((value) => !value)}>
                {showKey ? "Ocultar gabarito" : "Ver gabarito"}
              </button>
            </div>

            <div className="summary-grid">
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
            </div>

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
          </div>

          <div
            className="splitter horizontal"
            onMouseDown={startHorizontalResize}
            aria-label="Redimensionar estatísticas e perguntas"
          />

          <div className="questions-scroll">
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
          </div>
        </section>
      </div>
    </main>
  );
}
