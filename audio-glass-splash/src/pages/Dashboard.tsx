import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AudioSurveyLogo from "@/components/AudioSurveyLogo";
import BackgroundElements from "@/components/BackgroundElements";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, 
  ChevronRight, 
  BarChart3, 
  MessageSquare,
  UserCircle,
  LogOut,
  Copy,
  Check
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface Question {
  id: string;
  question: string;
  elaborate: boolean;
}

interface Survey {
  id: string;
  title: string;
  system_prompt: string;
  created_at: string;
  updated_at: string;
  questions: Question[];
  response_count?: number;
}

const Dashboard = () => {
  const [isHovering, setIsHovering] = useState(false);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { isAuthenticated, handleSignOut, token } = useGoogleAuth();
  const API_BASE_URL = 'http://localhost:5000/api';
  const navigate = useNavigate();
  
  // Fetch response counts for all surveys
  const fetchResponseCounts = async (surveysData: Survey[]) => {
    try {
      const updatedSurveys = await Promise.all(
        surveysData.map(async (survey) => {
          try {
            const response = await fetch(`${API_BASE_URL}/survey/${survey.id}/responses`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (!response.ok) throw new Error('Failed to fetch responses');
            const data = await response.json();
            return {
              ...survey,
              response_count: data.responses?.length || 0
            };
          } catch (error) {
            console.error(`Error fetching responses for survey ${survey.id}:`, error);
            return survey;
          }
        })
      );
      setSurveys(updatedSurveys);
    } catch (error) {
      console.error('Error fetching response counts:', error);
    }
  };
  
  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        if (!token) {
          throw new Error('No authentication token available');
        }

        const response = await fetch(`${API_BASE_URL}/survey`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch surveys');
        }
        const data = await response.json();
        setSurveys(data.surveys);
        // Fetch response counts after getting surveys
        await fetchResponseCounts(data.surveys);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load surveys",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && token) {
      fetchSurveys();
    }
  }, [isAuthenticated, token]);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleCreateSurvey = () => {
    navigate("/create-survey");
  };

  const handleViewResponses = (surveyId: string) => {
    toast({
      title: "View Responses",
      description: `Viewing responses for survey #${surveyId}`,
    });
    // This would navigate to a survey responses page in a real app
    // navigate(`/survey/${surveyId}/responses`);
  };

  const handleCopyLink = async (surveyId: string) => {
    const url = `http://localhost:6000/${surveyId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(surveyId);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: "Success",
        description: "Survey link copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center px-4 py-8">
      <BackgroundElements />
      
      {/* Header/Navigation */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-8 relative z-10">
        <div className="flex items-center">
          <AudioSurveyLogo className="h-8 w-auto" />
          <span className="ml-2 text-lg font-medium">Dashboard</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            Profile
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {/* Left column - Create new survey */}
        <div 
          className="col-span-1"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div 
            className={`glass-card rounded-2xl p-6 h-full transition-all duration-500 ${
              isHovering ? 'shadow-lg scale-[1.02]' : 'shadow-md'
            }`}
          >
            <h2 className="text-lg font-medium mb-6">Create New</h2>
            
            <Button 
              className="w-full py-8 mb-4 flex flex-col items-center gap-3 bg-primary-purple/10 hover:bg-primary-purple/20 text-foreground"
              onClick={handleCreateSurvey}
            >
              <PlusCircle className="h-10 w-10 text-primary-purple" />
              <span className="text-base font-medium">New Audio Survey</span>
            </Button>
            
            <p className="text-sm text-muted-foreground mt-4">
              Create a new audio survey to gather voice feedback from your customers.
            </p>
          </div>
        </div>
        
        {/* Right column - Survey list & analytics */}
        <div className="col-span-1 md:col-span-2">
          {/* Recent surveys */}
          <div className="glass-card rounded-2xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Your Surveys</h2>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                View All
              </Button>
            </div>
            
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading surveys...
                </div>
              ) : surveys.length > 0 ? (
                surveys.map((survey) => (
                  <div 
                    key={survey.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div>
                      <h3 className="font-medium">{survey.title || `Survey ${survey.id.slice(0, 8)}`}</h3>
                      <div className="flex items-center mt-1">
                        <MessageSquare className="h-3 w-3 text-muted-foreground mr-1" />
                        <span className="text-xs text-muted-foreground">{survey.questions.length} questions</span>
                        <span className="text-xs text-muted-foreground mx-2">•</span>
                        <span className="text-xs text-muted-foreground">{survey.response_count || 0} responses</span>
                        <span className="text-xs text-muted-foreground mx-2">•</span>
                        <span className="text-xs text-muted-foreground">Created {new Date(survey.created_at).toLocaleDateString()}</span>
                        <span className="text-xs text-muted-foreground mx-2">•</span>
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-2 text-xs"
                            onClick={() => handleCopyLink(survey.id)}
                          >
                            {copiedId === survey.id ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3 text-primary-purple" />
                            )}
                            <span className="ml-1">Copy Link</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => handleViewResponses(survey.id)}
                    >
                      View
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No surveys yet. Create your first survey to get started!
                </div>
              )}
            </div>
          </div>
          
          {/* Analytics summary */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center mb-4">
              <BarChart3 className="h-5 w-5 text-primary-purple mr-2" />
              <h2 className="text-lg font-medium">Analytics Overview</h2>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-accent/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-semibold">{surveys.length}</div>
                <div className="text-xs text-muted-foreground mt-1">Total Surveys</div>
              </div>
              
              <div className="bg-accent/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-semibold">
                  {surveys.reduce((sum, survey) => sum + (survey.response_count || 0), 0)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Total Responses</div>
              </div>
              
              <div className="bg-accent/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-semibold">
                  {surveys.length ? Math.round(surveys.reduce((sum, survey) => sum + (survey.response_count || 0), 0) / surveys.length) : 0}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Avg Responses</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Attribution */}
      <div className="absolute bottom-4 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Audio Survey
      </div>
    </div>
  );
};

export default Dashboard;
