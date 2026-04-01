import BaseModal from "./BaseModal";

export default function ConfirmModal({ title, message, onConfirm, onClose }) {
  return (
    <BaseModal onClose={onClose}>
      <h3>{title}</h3>
      <p>{message}</p>

      <div className="modal-actions">
        <button className="btn-cancel" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn-confirm"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          Confirm
        </button>
      </div>
    </BaseModal>
  );
}
