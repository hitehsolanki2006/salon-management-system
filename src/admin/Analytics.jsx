import ServiceAnalytics from "./ServiceAnalytics";
import UserAnalytics from "./UserAnalytics";
import StaffAnalytics from "./StaffAnalytics";
import "./Analytics.css";

export default function Analytics() {
  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h3>Business Analytics</h3>
        <p>Track your salon performance</p>
      </div>

      <ServiceAnalytics />
      <UserAnalytics />
      <StaffAnalytics />
    </div>
  );
}