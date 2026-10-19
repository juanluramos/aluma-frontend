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
import { socket } from "../../services/socketService";

function AttendanceChart() {
  const [data, setData] = useState<AnnualAttendance[]>([]);
  const [anioActual, setAnioActual] = useState<number | null>(null);
  const [anioAnterior, setAnioAnterior] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAnnualAttendance = async () => {
      try {
        const inscripciones = await getAnnualAttendance();
        setData(inscripciones.meses);
        setAnioActual(inscripciones.anioActual);
        setAnioAnterior(inscripciones.anioAnterior);
        setError("");
      } catch (causa) {
        console.error("Error al cargar las inscripciones por mes:", causa);
        setData([]);
        setError("No se pudieron cargar las inscripciones por mes.");
      }
    };

    loadAnnualAttendance();
    socket.on("dashboard:update", loadAnnualAttendance);
    return () => {
      socket.off("dashboard:update", loadAnnualAttendance);
    };
  }, []);

  return (
    <div className="attendance-chart">
      <h3>Inscripciones por mes</h3>
      <p className="attendance-chart-note">
        Total de inscripciones registradas según la fecha de la actividad, incluyendo todos los estados.
      </p>

      {error ? (
        <p className="attendance-chart-error" role="alert">{error}</p>
      ) : (
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
            name={anioActual == null ? "Año actual" : `Inscripciones ${anioActual}`}
            stroke="#BE1522"
            strokeWidth={3}
          />

          <Line
            type="monotone"
            dataKey="anterior"
            name={anioAnterior == null ? "Año anterior" : `Inscripciones ${anioAnterior}`}
            stroke="#656565"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
      )}
    </div>
  );
}

export default AttendanceChart;