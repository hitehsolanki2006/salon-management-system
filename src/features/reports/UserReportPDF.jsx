import jsPDF from "jspdf";
import { applyPlugin } from "jspdf-autotable";
import "../../style/UserReportPDF.css";

applyPlugin(jsPDF);

export default function UserReportPDF({ appointment }) {
  const downloadPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(245, 179, 1);
    doc.text("SalonFlow", 14, 15);

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Service Invoice", 14, 25);

    // Appointment Details
    doc.setFontSize(11);
    doc.text(`Invoice #${appointment.id}`, 14, 35);
    doc.text(
      `Date: ${new Date(appointment.appointment_time).toLocaleDateString()}`,
      14,
      42
    );
    doc.text(
      `Time: ${new Date(appointment.appointment_time).toLocaleTimeString()}`,
      14,
      49
    );
    doc.text(`Staff: ${appointment.staff?.full_name || "N/A"}`, 14, 56);

    // Services Table
    const tableData = appointment.appointment_services?.map((as) => [
      as.services.name,
      `₹${as.services.price}`
    ]) || [];

    doc.autoTable({
      startY: 65,
      head: [["Service", "Price"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [245, 179, 1], textColor: [18, 18, 18] },
      styles: { fontSize: 10 }
    });

    // Total
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text(`Total Amount: ₹${appointment.total_amount}`, 14, finalY);

    // Footer
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Thank you for choosing SalonFlow!", 14, finalY + 15);
    doc.text("www.salonflow.com | support@salonflow.com", 14, finalY + 20);

    doc.save(`invoice-${appointment.id}.pdf`);
  };

  return (
    <button className="btn-download-pdf" onClick={downloadPDF}>
      <span className="pdf-icon">📄</span>
      Download Invoice
    </button>
  );
}