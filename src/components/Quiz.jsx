import React, { useState, useEffect } from "react";
import he from "he";
import { useFetchQuestions } from "../hooks/useFetchQuestions";
import ResultsPopup from "./ResultsPopup";
import DetailedResultsPopup from "./DetailedResultsPopup";
import { Box, Typography, Grid, Paper, LinearProgress, Button } from "@mui/material";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { motion } from "framer-motion";
import { useTheme } from "@mui/material";

const Quiz = ({ name, category, onFinish }) => {
  const theme = useTheme();
  const { data: fetchedQuestions, isLoading, error } = useFetchQuestions(category);
  const { addScore } = useLeaderboard();

  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [showResultsPopup, setShowResultsPopup] = useState(false);
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  const [shuffledAnswers, setShuffledAnswers] = useState([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    if (fetchedQuestions && fetchedQuestions.length > 0 && questions.length === 0) {
      setQuestions(fetchedQuestions);
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setScore(0);
      setShowResultsPopup(false);
      setShowDetailedResults(false);
      setQuizFinished(false);
    }
  }, [fetchedQuestions]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleFinishQuiz();
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    if (questions.length > 0 && questions[currentQuestionIndex]) {
      const newAnswers = [...questions[currentQuestionIndex].incorrect_answers, questions[currentQuestionIndex].correct_answer];
      setShuffledAnswers(newAnswers.sort(() => Math.random() - 0.5));
    }
  }, [currentQuestionIndex, questions]);

  if (isLoading) return <Typography>Chargement des questions...</Typography>;
  if (error) return (
    <Box textAlign="center" mt={5}>
      <Typography color="error">❌ {error.message}</Typography>
      <Button variant="contained" onClick={() => window.location.reload()}>🔄 Réessayer</Button>
    </Box>
  );

  if (!questions || questions.length === 0) return <Typography>Aucune question trouvée.</Typography>;

  const currentQuestion = questions[currentQuestionIndex] ?? { incorrect_answers: [], correct_answer: "", question: "" };

  const handleAnswer = (answer) => {
    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentQuestionIndex] = answer;
    setUserAnswers(updatedAnswers);

    if (answer === currentQuestion.correct_answer) {
      setScore((prevScore) => prevScore + 1);
    }

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
    } else {
      handleFinishQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prevIndex) => prevIndex - 1);
    }
  };

  const handleFinishQuiz = () => {
    if (quizFinished) return;
    setQuizFinished(true);
    const totalTimeUsed = 120 - timeLeft;

    const newScore = {
      name: name || "Joueur inconnu",
      points: score,
      themeId: category,
      timeUsed: totalTimeUsed,
    };

    addScore(newScore);
    setShowResultsPopup(true);
    setTimeLeft(0);
  };

  return (
    <Box sx={{ textAlign: "center", p: 4, background: theme.palette.mode === "dark" ? "#222" : "#E3F2FD", borderRadius: "10px", boxShadow: 3, maxWidth: "600px", margin: "auto", mt: 5 }}>
      
      {/* 🕒 Timer */}
      <Typography variant="h6" fontWeight="bold" color={timeLeft <= 10 ? "red" : "black"}>
        ⏳ Temps restant : {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
      </Typography>
      <LinearProgress variant="determinate" value={(timeLeft / 120) * 100} sx={{ height: 10, borderRadius: 5, backgroundColor: "#ddd", "& .MuiLinearProgress-bar": { backgroundColor: timeLeft <= 10 ? "red" : "#1976D2" } }} />

      {/* 📌 Question */}
      <Typography 
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        variant="h5" fontWeight="bold" mt={3} mb={2}
        sx={{ color: theme.palette.mode === "dark" ? "#FFF" : "#000" }}
      >
        Question {currentQuestionIndex + 1}/{questions.length}
      </Typography>
      <Typography variant="body1" mb={3} p={2} sx={{ background: theme.palette.mode === "dark" ? "#424242" : "#ffffff", color: theme.palette.mode === "dark" ? "#FFF" : "#000", borderRadius: "10px", boxShadow: 2, fontSize: "1.2rem" }} 
        dangerouslySetInnerHTML={{ __html: he.decode(currentQuestion?.question || "Question introuvable") }} 
      />

      {/* 🔥 Réponses */}
      <Grid container spacing={2} justifyContent="center">
        {shuffledAnswers.map((answer, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Paper
              onClick={() => handleAnswer(answer)}
              component={motion.div}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              sx={{
                p: 2,
                cursor: "pointer",
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "1rem",
                borderRadius: "10px",
                backgroundColor: theme.palette.mode === "dark" ? "#666" : "#fff",
                color: theme.palette.mode === "dark" ? "#FFF" : "#000",
                transition: "0.3s",
                "&:hover": { backgroundColor: "#1976D2", color: "white" },
                boxShadow: 2,
              }}
            >
              {he.decode(answer || "Réponse introuvable")}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* 🔙 Boutons supplémentaires */}
      <Button 
        variant="contained" 
        onClick={handlePreviousQuestion} 
        sx={{ mt: 3, mr: 2 }} 
        disabled={currentQuestionIndex === 0}
      >
        ⬅️ Question précédente
      </Button>

      <Button 
        variant="contained" 
        color="error"
        onClick={handleFinishQuiz} 
        sx={{ mt: 3 }}
      >
        🛑 Mettre fin à la partie
      </Button>

      {/* ✅ Popups des résultats */}
      {showResultsPopup && (
        <ResultsPopup
          score={score}
          totalQuestions={questions.length}
          userAnswers={userAnswers}
          questions={questions}
          timeUsed={120 - timeLeft}
          onRestart={() => window.location.reload()}
          onFinish={onFinish}
          onViewDetails={() => setShowDetailedResults(true)}
          onClose={() => setShowResultsPopup(false)}
        />
      )}

      {showDetailedResults && (
        <DetailedResultsPopup
          questions={questions}
          userAnswers={userAnswers}
          onClose={() => setShowDetailedResults(false)}
        />
      )}
    </Box>
  );
};

export default Quiz;
