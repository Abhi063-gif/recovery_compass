import { apiClient } from './client';
import { ENDPOINTS, DoctorQuestionDto } from '@recovery-compass/contracts';

export const questionsApi = {
  async getByPlan(planId: string): Promise<DoctorQuestionDto[]> {
    return apiClient.get<DoctorQuestionDto[]>(ENDPOINTS.PLANS.DOCTOR_QUESTIONS(planId));
  },

  async generate(planId: string): Promise<{ message: string }> {
    return apiClient.post(ENDPOINTS.PLANS.GENERATE_QUESTIONS(planId));
  },

  async resolve(id: string, note?: string): Promise<DoctorQuestionDto> {
    return apiClient.post<DoctorQuestionDto>(ENDPOINTS.DOCTOR_QUESTIONS.RESOLVE(id), { note });
  },
};
