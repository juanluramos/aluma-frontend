import { useEffect, useState } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import {
  getAnnualAttendance,
  type AnnualAttendance,
} from "../../services/dashboardService";

function AttendanceChart() {
  const [data, setData] = useState<AnnualAttendance[]>([]);

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  useEffect(() => {
    const loadAnnualAttendance = async () => {
      try {
        const attendance = await getAnnualAttendance();

        setData(attendance);
      } catch (error) {
        console.error(
          "Error al cargar la asistencia anual:",
          error
        );
      }
    };

    loadAnnualAttendance();
  }, []);

  return (
    <div className="attendance-chart">
      <h3>Asistencia anual</h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="month" />

          <YAxis />

          <Tooltip />

          <Legend />

          <Line
            type="monotone"
            dataKey="actual"
            name={currentYear.toString()}
            stroke="#BE1522"
            strokeWidth={3}
          />

          <Line
            type="monotone"
            dataKey="anterior"
            name={previousYear.toString()}
            stroke="#656565"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default AttendanceChart;