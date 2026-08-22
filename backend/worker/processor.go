package main

import "backend/db"

type Job struct {
	Title       string
	Company     string
	Location    string
	WorkType    string
	Experience  string
	Salary      string
	Description string
}

func process(JobId string, resume string, coverLetter string) (Analysis, error) {

	var job Job

	err := db.DB.QueryRow(`
		SELECT title, company, location, work_type, experience_level, salary, description 
		FROM jobs WHERE job_id=$1`,
		JobId).Scan(
		&job.Company,
		&job.Location,
		&job.WorkType,
		&job.Experience,
		&job.Salary,
		&job.Description,
		&job.Title,
	)

	if err != nil {
		return Analysis{}, err
	}

	AiResults, _ := OpenAIProcessing(resume, coverLetter, job)

	return AiResults, nil
}
