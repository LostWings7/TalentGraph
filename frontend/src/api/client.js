import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to attach Auth Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tg_auth_token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-clear on login failures
      if (!error.config.url.includes('/auth/login/')) {
        localStorage.removeItem('tg_auth_token');
        localStorage.removeItem('tg_auth_user');
      }
    }
    return Promise.reject(error);
  }
);

export const TalentAPI = {
  // System Health & AI Status
  getHealth: () => api.get('/health/'),
  getAIStatus: () => api.get('/ai/status/'),

  // Authentication & Tenant Identity
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: () => api.post('/auth/logout/'),
  getMe: () => api.get('/auth/me/'),
  changePassword: (passwords) => api.post('/auth/change-password/', passwords),
  enterpriseSetup: (data) => api.post('/auth/enterprise-setup/', data),
  getDemoAccounts: () => api.get('/auth/demo-accounts/'),

  // Enterprise Governance & Capability
  getEnterpriseProfile: () => api.get('/enterprises/profile/'),
  updateEnterpriseProfile: (data) => api.put('/enterprises/profile/', data),
  getCapabilityMap: () => api.get('/enterprises/capability-map/'),
  getApprovals: (params) => api.get('/approvals/', { params }),
  submitApproval: (data) => api.post('/approvals/', data),
  resolveApproval: (id, data) => api.post(`/approvals/${id}/resolve/`, data),
  getAuditLogs: (params) => api.get('/audit/', { params }),

  // Employees
  getEmployees: (params) => api.get('/employees/', { params }),
  getEmployeeDetail: (id) => api.get(`/employees/${id}/`),
  getEmployeeSkills: (id) => api.get(`/employees/${id}/skills/`),
  addEmployeeSkill: (id, data) => api.post(`/employees/${id}/skills/`, data),
  getEmployeeCareerGoal: (id) => api.get(`/employees/${id}/career-goal/`),
  setEmployeeCareerGoal: (id, data) => api.post(`/employees/${id}/career-goal/`, data),

  // Skills
  getSkills: (params) => api.get('/skills/', { params }),
  getSkillCategories: () => api.get('/skills/categories/'),

  // Projects & Staffing
  getProjects: () => api.get('/projects/'),
  getProjectDetail: (id) => api.get(`/projects/${id}/`),
  getProjectContributors: (projectId) => api.get(`/projects/${projectId}/contributors/`),
  submitProjectContribution: (projectId, data) => api.post(`/projects/${projectId}/contributors/`, data),
  assignProjectContributor: (projectId, empId, data) => api.post(`/projects/${projectId}/assign/${empId}/`, data),
  getEmployeeContributions: (empId) => api.get(`/projects/employee/${empId}/`),
  
  // AI Staffing Engine
  getStaffingRequests: () => api.get('/projects/staffing/'),
  createStaffingRequest: (data) => api.post('/projects/staffing/', data),
  analyzeStaffing: (requestId, data = {}) => api.post(`/projects/staffing/${requestId}/analyze/`, data),
  buildOptimalTeam: (requestId, data = {}) => api.post(`/projects/staffing/${requestId}/team-builder/`, data),
  assignStaffingCandidate: (requestId, empId, data = {}) => api.post(`/projects/staffing/${requestId}/assign/${empId}/`, data),

  // Roles
  getRoles: (params) => api.get('/roles/', { params }),
  getRoleDetail: (id) => api.get(`/roles/${id}/`),
  getRoleDepartments: () => api.get('/roles/departments/'),

  // Learning
  getLearningResources: (params) => api.get('/learning/', { params }),
  getEmployeeLearnings: (empId) => api.get(`/learning/employee/${empId}/`),
  enrollEmployeeLearning: (empId, data) => api.post(`/learning/employee/${empId}/`, data),

  // Mobility & Matching
  getRankedRoleMatches: (empId, params) => api.get(`/mobility/matches/${empId}/`, { params }),
  getRoleMatchDetail: (empId, roleId, params) => api.get(`/mobility/match/${empId}/${roleId}/`, { params }),
  getSkillGapAnalysis: (empId, roleId) => api.get(`/mobility/skill-gap/${empId}/${roleId}/`),
  getCareerRoadmap: (empId, roleId) => api.get(`/mobility/roadmap/${empId}/${roleId}/`),
  simulateWhatIf: (empId, roleId, data = {}) => api.post(`/mobility/what-if/${empId}/${roleId}/`, data),

  // Feedback
  submitFeedback: (data) => api.post('/feedback/', data),

  // HR Workforce Intelligence
  getHRIntelligence: () => api.get('/analytics/dashboard/'),

  // AI Actions & Assistants
  runAIProfileInference: (empId, data) => api.post(`/ai/profile/${empId}/`, data),
  chatCareerAssistant: (data) => api.post('/ai/assistant/chat/', data),
  chatHRAssistant: (data) => api.post('/ai/assistant/hr/', data),

  // Persona Studio & Account Ingestion
  getDemoPersonas: () => api.get('/personas/demos/'),
  getDemoPersonaFiles: (demoId) => api.get(`/personas/demos/${demoId}/files/`),
  parsePersonaFiles: (data, isMultipart = false) => api.post(
    '/personas/parse-files/', 
    data, 
    isMultipart ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}
  ),
  analyzePersona: (data) => api.post('/personas/analyze/', data),
  createPersona: (data) => api.post('/personas/create/', data),
  deletePersona: (id) => api.delete(`/personas/${id}/`),
  getPersonasStats: () => api.get('/personas/stats/'),
};

export default api;
