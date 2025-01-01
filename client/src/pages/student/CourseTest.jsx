import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetTestsByCourseQuery } from '../../features/api/testApi';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const CourseTest = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const { data: testData, isLoading } = useGetTestsByCourseQuery(courseId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!testData?.tests?.[0]) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">No Test Available</h2>
        <p className="text-gray-600 mb-4">There is no test available for this course yet.</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const test = testData.tests[0];
  const questions = test.questions;

  const handleAnswerSelect = (questionId, answer) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = () => {
    // Calculate results
    let correctAnswers = 0;
    questions.forEach(question => {
      if (selectedAnswers[question._id] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const percentage = (correctAnswers / questions.length) * 100;
    setShowResults(true);
    
    toast.success(`Test completed! Score: ${percentage.toFixed(2)}%`);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  if (showResults) {
    const score = Object.keys(selectedAnswers).reduce((correct, questionId) => {
      const question = questions.find(q => q._id === questionId);
      return selectedAnswers[questionId] === question.correctAnswer ? correct + 1 : correct;
    }, 0);
    
    const percentage = (score / questions.length) * 100;
    const passedTest = percentage >= 80;

    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Test Results</h2>
          <div className="flex items-center gap-4">
            <span className={`text-lg font-semibold ${passedTest ? 'text-green-600' : 'text-red-600'}`}>
              Score: {percentage.toFixed(2)}%
            </span>
            {passedTest && (
              <Button 
                onClick={() => navigate(`/certificate/${courseId}`)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                View Certificate
              </Button>
            )}
          </div>
        </div>
        {questions.map((question, index) => (
          <div key={question._id} className="mb-6 p-4 bg-white rounded-lg shadow">
            <p className="font-semibold mb-2">Question {index + 1}: {question.question}</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(question.options).map(([key, value]) => (
                <div
                  key={key}
                  className={`p-2 rounded border ${
                    key === question.correctAnswer
                      ? 'bg-green-100 border-green-500'
                      : selectedAnswers[question._id] === key
                      ? 'bg-red-100 border-red-500'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {key.toUpperCase()}: {value}
                </div>
              ))}
            </div>
          </div>
        ))}
        <Button onClick={() => navigate(-1)} className="mt-4">Finish</Button>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Course Test</h2>
          <span className="text-gray-600">
            Question {currentQuestion + 1} of {questions.length}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded">
          <div
            className="h-full bg-purple-600 rounded"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <p className="text-lg font-semibold mb-4">{currentQ.question}</p>
        <div className="grid grid-cols-1 gap-3">
          {Object.entries(currentQ.options).map(([key, value]) => (
            <Button
              key={key}
              variant={selectedAnswers[currentQ._id] === key ? "default" : "outline"}
              className={`w-full justify-start text-left ${
                selectedAnswers[currentQ._id] === key
                  ? "bg-purple-600 text-white"
                  : "hover:bg-purple-50"
              }`}
              onClick={() => handleAnswerSelect(currentQ._id, key)}
            >
              <span className="font-semibold mr-2">{key.toUpperCase()}.</span> {value}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>
        {currentQuestion === questions.length - 1 ? (
          <Button onClick={handleSubmit}>Submit Test</Button>
        ) : (
          <Button onClick={handleNext}>Next Question</Button>
        )}
      </div>
    </div>
  );
};

export default CourseTest;
