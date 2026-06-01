import { useState, useEffect } from 'react'
import { fetchEmployees, fetchAttendanceLogs } from '../services/api'

export function useAttendanceData(isLoggedIn) {
  const [employees, setEmployees] = useState([])
  const [attendanceLogs, setAttendanceLogs] = useState([])
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) {
      setIsLoadingDashboard(false)
      return
    }

    let cancelled = false
    setIsLoadingDashboard(true)

    const loadData = async () => {
      try {
        const [employeesData, logsData] = await Promise.all([
          fetchEmployees().catch(() => []),
          fetchAttendanceLogs().catch(() => []),
        ])

        if (!cancelled) {
          setEmployees(employeesData || [])
          setAttendanceLogs(logsData || [])
        }
      } catch {
        // Errors are handled per-request above
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
