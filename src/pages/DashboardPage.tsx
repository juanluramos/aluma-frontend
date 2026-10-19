import "./DashboardPage.css";
import "../styles/variables.css";

import { useEffect, useState } from "react";

import { socket } from "../services/socketService";

import {
  getDashboardSummary,
  getUpcomingActivities,
  type DashboardSummary,
  type UpcomingActivity,
} from "../services/dashboardService";

import usuarioIcon from "../assets/icons/navigation/usuarios_icono.webp";
import usuarioActivoIcon from "../assets/icons/navigation/activos_icono.webp";
import actividadesIcon from "../assets/icons/navigation/calendar.webp";
import inscritosIcon from "../assets/icons/navigation/inscritos-icon.png";

import AttendanceChart from "../components/dashboard/AttendanceChart";
import PaymentStatusChart from "../components/dashboard/PaymentStatusChart";
import WeatherForecast from "../components/dashboard/WeatherForecast";
import { lineasPlazas } from "../utils/ocupacionActividad";

function textoOcupacion(activity: UpcomingActivity): string {
  const plazas = lineasPlazas(activity);
  return plazas.hayEspera ? `${plazas.ocupadas} · ${plazas.espera} en espera` : plazas.ocupadas;
}

function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>({
    usuarios: 0,
    usuariosActivos: 0,
    actividadesActivas: 0,
    inscripciones: 0,
  });

  const [upcomingActivities, setUpcomingActivities] = useState<
    UpcomingActivity[]
  >([]);

  useEffect(() => {
    const loadDashboardSummary = async () => {
      try {
        const data = await getDashboardSummary();

        setSummary(data);
      } catch (error) {
        console.error(
          "Error al cargar el resumen del dashboard:",
          error
        );
      }
    };

    const loadUpcomingActivities = async () => {
      try {
        const data = await getUpcomingActivities();

        setUpcomingActivities(data);
      } catch (error) {
        console.error(
          "Error al cargar las próximas actividades:",
          error
        );
      }
    };

    const refreshDashboard = () => {
      loadDashboardSummary();
      loadUpcomingActivities();
    };

    refreshDashboard();

    socket.on("dashboard:update", refreshDashboard);

    return () => {
      socket.off("dashboard:update", refreshDashboard);
    };
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
    });
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <div className="dashboard-card-icon">
            <img src={usuarioIcon} alt="Usuarios" />
          </div>

          <div className="dashboard-card-content">
            <h3>Usuarios</h3>

            <p className="dashboard-card-number">
              {summary.usuarios}
            </p>

            <span>Total</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon">
            <img
              src={usuarioActivoIcon}
              alt="Usuarios activos"
            />
          </div>

          <div className="dashboard-card-content">
            <h3>Activos</h3>

            <p className="dashboard-card-number">
              {summary.usuariosActivos}
            </p>

            <span>Usuarios</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon">
            <img
              src={actividadesIcon}
              alt="Actividades"
            />
          </div>

          <div className="dashboard-card-content">
            <h3>Actividades</h3>

            <p className="dashboard-card-number">
              {summary.actividadesActivas}
            </p>

            <span>Activas</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon">
            <img
              src={inscritosIcon}
              alt="Inscripciones"
            />
          </div>

          <div className="dashboard-card-content">
            <h3>Inscritos</h3>

            <p className="dashboard-card-number">
              {summary.inscripciones}
            </p>

            <span>Total</span>
          </div>
        </div>
      </div>

      <div className="dashboard-charts">
        <AttendanceChart />

        <PaymentStatusChart />
      </div>

      <div className="dashboard-bottom">
        <div className="upcoming-activities">
          <h3>Próximas actividades</h3>

          {upcomingActivities.length === 0 ? (
            <p>No hay próximas actividades.</p>
          ) : (
            upcomingActivities.map((activity) => (
              <div
                className="upcoming-activity"
                key={activity.id}
              >
                <div>
                  <strong>{activity.titulo}</strong>

                  <span>
                    {formatDate(activity.fecha)}
                  </span>
                </div>

                <span>
                  {textoOcupacion(activity)}
                </span>
              </div>
            ))
          )}
        </div>

        <WeatherForecast />
      </div>
    </div>
  );
}

export default DashboardPage;