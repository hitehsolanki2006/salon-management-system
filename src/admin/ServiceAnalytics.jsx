import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import "./Analytics.css";

export default function ServiceAnalytics() {
  const [data, setData] = useState([]);

  const fetchServiceUsage = async () => {
    const { data } = await supabase
      .from("appointment_services")
      .select("service_id, services(name)");

    const map = {};

    data?.forEach((row) => {
      const name = row.services.name;
      map[name] = (map[name] || 0) + 1;
    });

    const formatted = Object.keys(map).map((key) => ({
      name: key,
      count: map[key]
    }));

    setData(formatted);
  };

  useEffect(() => {
    fetchServiceUsage();
  }, []);

  const COLORS = ['#F5B301', '#FF9800', '#FFC107', '#FFD54F', '#FFE082'];

  return (
    <div className="analytics-card">
      <div className="card-header">
        <h4>📊 Service Popularity</h4>
        <p>Most booked services</p>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis 
              dataKey="name" 
              stroke="#B0B0B0"
              style={{ fontSize: '0.85rem' }}
            />
            <YAxis 
              stroke="#B0B0B0"
              style={{ fontSize: '0.85rem' }}
            />
            <Tooltip
              contentStyle={{
                background: '#1E1E1E',
                border: '1px solid #F5B301',
                borderRadius: '8px',
                color: '#FFFFFF'
              }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}