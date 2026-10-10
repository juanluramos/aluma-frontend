import { useEffect, useState } from "react";

import {
  PieChart,
  Pie,
  Sector,
  Tooltip,
  ResponsiveContainer,
  type PieSectorShapeProps,
} from "recharts";

import {
  getPaymentStatus,
  type PaymentStatus,
} from "../../services/dashboardService";

const COLORS: Record<string, string> = {
  Pagado: "#4CAF50",
  Pendiente: "#FFC107",
  Cancelado: "#BE1522",
  Devolución: "#656565",
};

function getColor(name: string) {
  return COLORS[name] ?? "#999999";
}

function renderSector(props: PieSectorShapeProps) {
  const payload = props.payload as PaymentStatus;

  return (
    <Sector
      {...props}
      fill={getColor(payload.name)}
    />
  );
}

function PaymentStatusChart() {
  const [data, setData] = useState<PaymentStatus[]>([]);

  useEffect(() => {
    const loadPaymentStatus = async () => {
      try {
        const paymentStatus = await getPaymentStatus();

        setData(paymentStatus);
      } catch (error) {
        console.error(
          "Error al cargar el estado de pagos:",
          error
        );
      }
    };

    loadPaymentStatus();
  }, []);

  return (
    <div className="payment-status-chart">
      <h3>Estado de pagos</h3>

      <ResponsiveContainer width="100%" height={230}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            shape={renderSector}
          />

          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      <div className="payment-status-legend">
        {data.map((item) => (
          <div
            className="payment-status-legend-item"
            key={item.name}
          >
            <span
              className="payment-status-legend-color"
              style={{
                backgroundColor: getColor(item.name),
              }}
            />

            <span>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PaymentStatusChart;