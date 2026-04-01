import { supabase } from "../../lib/supabase";
import { useModal } from "../../context/ModalContext";

export default function StaffActionButtons({ appointment, onUpdate }) {
  const { openConfirm, openSuccess, openError } = useModal();

  async function updateStatus(newStatus) {
    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", appointment.id);

    if (error) {
      openError(error.message, "Update Failed");
      return;
    }

    openSuccess(
      `Appointment marked as ${newStatus.replace("_", " ")}`,
      "Status Updated"
    );

    onUpdate();
  }

  if (appointment.status === "approved") {
    return (
      <button
        onClick={() =>
          openConfirm(
            "Start service for this customer?",
            () => updateStatus("in_progress")
          )
        }
      >
        ▶ Start Service
      </button>
    );
  }

  if (appointment.status === "in_progress") {
    return (
      <button
        onClick={() =>
          openConfirm(
            "Mark service as completed?",
            () => updateStatus("service_done")
          )
        }
      >
        ✔ Finish Service
      </button>
    );
  }

  return null;
}
