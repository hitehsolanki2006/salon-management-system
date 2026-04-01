import BaseModal from "./BaseModal";

export default function MessageModal({ type, title, message, onClose }) {
  return (
    <BaseModal onClose={onClose}>
      <h3 className={`modal-title ${type}`}>{title}</h3>
      <div className="modal-body">
        <p>{message}</p>
      </div>

      <div className="modal-actions" style={{ justifyContent: 'center' }}>
        {/* Only one button for Informational popups */}
        <button className="btn-confirm" onClick={onClose}>
          OK
        </button>
      </div>
    </BaseModal>
  );
}