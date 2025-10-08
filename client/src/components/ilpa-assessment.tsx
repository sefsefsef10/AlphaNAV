import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  question: string;
  options: { value: string; label: string; score: number }[];
}

const assessmentQuestions: Question[] = [
  {
    id: "1",
    question: "Does your fund have documented NAV lending policies in place?",
    options: [
      { value: "yes-comprehensive", label: "Yes, comprehensive policies", score: 10 },
      { value: "yes-basic", label: "Yes, basic policies", score: 7 },
      { value: "in-development", label: "Currently in development", score: 4 },
      { value: "no", label: "No", score: 0 },
    ],
  },
  {
    id: "2",
    question: "Are your financial reporting systems ready for quarterly NAV lending compliance?",
    options: [
      { value: "fully-automated", label: "Fully automated and tested", score: 10 },
      { value: "mostly-ready", label: "Mostly ready, some manual processes", score: 7 },
      { value: "basic", label: "Basic systems in place", score: 4 },
      { value: "not-ready", label: "Not ready", score: 0 },
    ],
  },
  {
    id: "3",
    question: "How ILPA-aligned is your fund structure?",
    options: [
      { value: "fully-aligned", label: "Fully ILPA-aligned", score: 10 },
      { value: "mostly-aligned", label: "Mostly aligned", score: 7 },
      { value: "partially", label: "Partially aligned", score: 4 },
      { value: "not-aligned", label: "Not aligned", score: 0 },
    ],
  },
  {
    id: "4",
    question: "Does your team have experience with NAV lending covenants?",
    options: [
      { value: "extensive", label: "Extensive experience", score: 10 },
      { value: "some", label: "Some experience", score: 7 },
      { value: "limited", label: "Limited experience", score: 4 },
      { value: "none", label: "No experience", score: 0 },
    ],
  },
  {
    id: "5",
    question: "Is NAV lending integrated into your fund's business plan?",
    options: [
      { value: "core-strategy", label: "Core part of strategy", score: 10 },
      { value: "planned", label: "Planned for integration", score: 7 },
      { value: "considering", label: "Considering it", score: 4 },
      { value: "not-considered", label: "Not yet considered", score: 0 },
    ],
  },
];

export function ILPAAssessment() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isComplete, setIsComplete] = useState(false);

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const calculateScore = () => {
    let totalScore = 0;
    assessmentQuestions.forEach((q) => {
      const answer = answers[q.id];
      if (answer) {
        const option = q.options.find((opt) => opt.value === answer);
        if (option) totalScore += option.score;
      }
    });
    return totalScore;
  };

  const maxScore = assessmentQuestions.length * 10;
  const currentScore = calculateScore();
  const percentage = (currentScore / maxScore) * 100;
  const allAnswered = assessmentQuestions.every((q) => answers[q.id]);

  const getReadinessLevel = (score: number) => {
    if (score >= 80) return { label: "Excellent", icon: CheckCircle, color: "text-success" };
    if (score >= 60) return { label: "Good", icon: CheckCircle, color: "text-chart-3" };
    if (score >= 40) return { label: "Fair", icon: AlertCircle, color: "text-warning" };
    return { label: "Needs Improvement", icon: XCircle, color: "text-danger" };
  };

  const readiness = getReadinessLevel(percentage);
  const ReadinessIcon = readiness.icon;

  return (
    <div className="space-y-6">
      {!isComplete ? (
        <>
          {assessmentQuestions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="text-base font-medium">
                  {index + 1}. {question.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={answers[question.id]}
                  onValueChange={(value) => handleAnswer(question.id, value)}
                >
                  {question.options.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={option.value}
                        id={`${question.id}-${option.value}`}
                        data-testid={`radio-${question.id}-${option.value}`}
                      />
                      <Label
                        htmlFor={`${question.id}-${option.value}`}
                        className="cursor-pointer flex-1 py-2"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-end">
            <Button
              size="lg"
              disabled={!allAnswered}
              onClick={() => setIsComplete(true)}
              data-testid="button-complete-assessment"
            >
              Complete Assessment
            </Button>
          </div>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>NAV Readiness Assessment Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <ReadinessIcon className={cn("h-16 w-16", readiness.color)} />
              </div>
              <div>
                <p className="text-4xl font-bold font-mono tabular-nums mb-2">
                  {percentage.toFixed(0)}%
                </p>
                <Badge variant="outline" className={cn("text-base px-4 py-1", readiness.color)}>
                  {readiness.label}
                </Badge>
              </div>
              <Progress value={percentage} className="h-3" />
            </div>

            <div className="space-y-3 pt-6 border-t border-border">
              <h3 className="font-semibold">Recommendations</h3>
              {percentage >= 80 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    ✓ Your fund demonstrates excellent NAV lending readiness
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ✓ Well-positioned for ILPA-aligned NAV facilities
                  </p>
                  <p className="text-sm text-muted-foreground">
                    → Recommended: Proceed with underwriting application
                  </p>
                </div>
              ) : percentage >= 60 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    ✓ Strong foundation for NAV lending
                  </p>
                  <p className="text-sm text-muted-foreground">
                    → Recommended: Review educational materials for areas of improvement
                  </p>
                  <p className="text-sm text-muted-foreground">
                    → Consider: Schedule consultation with our team
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    → Focus on establishing NAV lending policies
                  </p>
                  <p className="text-sm text-muted-foreground">
                    → Review ILPA alignment requirements
                  </p>
                  <p className="text-sm text-muted-foreground">
                    → Explore our educational webinars and templates
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsComplete(false)} className="flex-1">
                Retake Assessment
              </Button>
              <Button className="flex-1" data-testid="button-get-recommendations">
                Get Detailed Recommendations
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
