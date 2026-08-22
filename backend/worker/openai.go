package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	openai "github.com/openai/openai-go/v3"
	"github.com/openai/openai-go/v3/option"
	"github.com/openai/openai-go/v3/responses"
)

type Analysis struct {
	MatchScore int    `json:"match_score"`
	Decision   string `json:"decision"`
	Feedback   string `json:"feedback"`
}

func OpenAIProcessing(resume string, coverLetter string, job Job) (Analysis, error) {
	prompt := fmt.Sprintf(`
	You are an AI hiring assistant.

	Your task is to compare the candidate's resume and cover letter against the job description. 

	Evaluate:
	- Technical skill match
	- Relevant experience
	- Overall suitability

	Return ONLY valid JSON in exactly this format:

	{
	"match_score": <integer from 0 to 100>,
	"decision": "Interview" or "Rejected",
	"feedback": "<2-4 sentences explaining the decision>"
	}

	Resume: %s
	Cover Letter: %s
	Job:
	Title: %s
	Company: %s
	Location: %s

	Description:
	%s
	`,
		resume,
		coverLetter,
		job.Title,
		job.Company,
		job.Location,
		job.Description)

	client := openai.NewClient(
		option.WithAPIKey(os.Getenv("OPENAI_API_KEY")),
	)

	res, err := client.Responses.New(
		context.Background(),
		responses.ResponseNewParams{
			Model: openai.ChatModelGPT5,
			Input: responses.ResponseNewParamsInputUnion{
				OfString: openai.String(prompt),
			},
		},
	)

	if err != nil {
		return Analysis{}, err
	}

	text := res.OutputText()

	var analysis Analysis
	err = json.Unmarshal([]byte(text), &analysis)
	if err != nil {
		return Analysis{}, err
	}

	return analysis, nil
}
