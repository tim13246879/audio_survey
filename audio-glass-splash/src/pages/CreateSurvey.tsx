import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AudioSurveyLogo from "@/components/AudioSurveyLogo";
import BackgroundElements from "@/components/BackgroundElements";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, MinusCircle, ChevronLeft } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Question {
  id: string;
  question: string;
  elaborate: boolean;
}

const CreateSurvey = () => {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useGoogleAuth();
  const API_BASE_URL = 'http://localhost:5000/api';

  const [title, setTitle] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { id: "1", question: "", elaborate: false }
  ]);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: (questions.length + 1).toString(),
        question: "",
        elaborate: false
      }
    ]);
  };

  const handleRemoveQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const handleQuestionChange = (id: string, value: string) => {
    setQuestions(
      questions.map(q => q.id === id ? { ...q, question: value } : q)
    );
  };

  const handleElaborateChange = (id: string) => {
    setQuestions(
      questions.map(q => q.id === id ? { ...q, elaborate: !q.elaborate } : q)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE_URL}/survey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          system_prompt: systemPrompt,
          questions: questions.map(({ question, elaborate }) => ({ question, elaborate }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create survey');
      }

      toast({
        title: "Success",
        description: "Survey created successfully",
      });
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create survey",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center px-4 py-8">
      <BackgroundElements />
      
      {/* Header */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-8 relative z-10">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-4"
            onClick={() => navigate("/dashboard")}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <AudioSurveyLogo className="h-8 w-auto" />
          <span className="ml-2 text-lg font-medium">Create Survey</span>
        </div>
      </div>

      {/* Main content */}
      <Card className="w-full max-w-4xl relative z-10">
        <CardHeader>
          <CardTitle>New Audio Survey</CardTitle>
          <CardDescription>
            Create a new survey to gather voice feedback from your customers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Survey Title</Label>
              <Input
                id="title"
                placeholder="Enter survey title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                placeholder="Enter system prompt for AI processing"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Questions</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddQuestion}
                  className="flex items-center gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Question
                </Button>
              </div>

              {questions.map((question, index) => (
                <Card key={question.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <Input
                          placeholder={`Question ${index + 1}`}
                          value={question.question}
                          onChange={(e) => handleQuestionChange(question.id, e.target.value)}
                          required
                        />
                      </div>
                      {questions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveQuestion(question.id)}
                          className="text-destructive"
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`elaborate-${question.id}`}
                        checked={question.elaborate}
                        onChange={() => handleElaborateChange(question.id)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor={`elaborate-${question.id}`} className="text-sm">
                        Allow elaboration for this question
                      </Label>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Button type="submit" className="w-full">
              Create Survey
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateSurvey; 