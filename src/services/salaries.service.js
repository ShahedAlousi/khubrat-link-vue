import api from './api'

export default {
  // GET /management/salaries with optional query params: month, year, status, employee_id, per_page, page
  list(params = {}) {
    return api.get('/management/salaries', { params }).then((res) => {
      // Follow project's convention: if payload nested under data.data return that, otherwise return res.data
      return res.data?.data ?? res.data
    })
  },

  // GET /management/salaries/{id}
  get(id) {
    return api.get(`/management/salaries/${id}`).then((res) => res.data)
  },

  // GET /management/salaries/employees/{employee}/history
  employeeHistory(employeeId) {
    return api.get(`/management/salaries/employees/${employeeId}/history`).then((res) => res.data)
  },

  // GET /management/salaries/by-month?month=&year=&per_page=
  byMonth(month, year, per_page = 100) {
    return api.get('/management/salaries/by-month', { params: { month, year, per_page } }).then((res) => res.data)
  },

  // POST /management/salaries/generate
  generate(payload) {
    return api.post('/management/salaries/generate', payload).then((res) => res.data)
  },

  // POST /management/salaries/{id}/pay
  pay(id) {
    return api.post(`/management/salaries/${id}/pay`).then((res) => res.data)
  }
}