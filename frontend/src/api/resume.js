import client from './client.js'

export async function uploadResume(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await client.post('/upload/resume', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function analyzeResume({ resume_id, job_description, job_title, company }) {
  const res = await client.post('/analyze', { resume_id, job_description, job_title, company })
  return res.data
}

export async function getResult(analysisId) {
  const res = await client.get(`/results/${analysisId}`)
  return res.data
}

export async function getHistory() {
  const res = await client.get('/history')
  return res.data
}

export async function compareAnalyses(baselineId, revisedId) {
  const { data } = await api.post('/analyze/compare', {
    baseline_id: baselineId,
    revised_id:  revisedId,
  })
  return data
}