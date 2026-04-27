import { useState, useEffect } from 'react'
import { fetchEmployees, fetchAttendanceLogs } from '../services/api'
import { getCookie } from '../utils/cookies'

export function useAttendanceData(isLoggedIn) {
  const [employees, setEmployees] = useState([])
  const [attendanceLogs, setAttendanceLogs] = useState([])
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) {
      setIsLoadingDashboard(false)
      return
    }

    const token = getCookie('dtr_admin_token')
    if (!token) {
      console.log('No token found')
      setIsLoadingDashboard(false)
      return
    }

    let cancelled = false
    setIsLoadingDashboard(true)

    const loadData = async () => {
      try {
        console.log('Fetching employees and logs...')
        const [employeesData, logsData] = await Promise.all([
          fetchEmployees(token).catch(err => {
            console.warn('Failed to fetch employees, using empty array:', err.message)
            return []
          }),
          fetchAttendanceLogs(token).catch(err => {
            console.warn('Failed to fetch logs, using empty array:', err.message)
            return []
          }),
        ])

        console.log('Employees data:', employeesData)
        console.log('Logs data:', logsData)

        if (!cancelled) {
          setEmployees(employeesData || [])
          setAttendanceLogs(logsData || [])
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load data:', error)
          console.error('Error details:', error.message)
          // Don't set empty arrays here since we handle it in the catch above
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDashboard(false)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [isLoggedIn])

  return {
    employees,
    setEmployees,
    attendanceLogs,
    setAttendanceLogs,
    isLoadingDashboard,
    setIsLoadingDashboard,
  }
}
