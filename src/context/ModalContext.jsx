import { createContext, useContext, useState } from "react";
import ConfirmModal from "../components/modals/ConfirmModal";
import MessageModal from "../components/modals/MessageModal";

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [modal, setModal] = useState(null);

  const closeModal = () => setModal(null);

  // Updated to accept direct arguments instead of one object
  const openConfirm = (message, onConfirm, title = "Are you sure?") => {
    setModal({
      type: "confirm",
      title,
      message,
      onConfirm
    });
  };

  

  const openSuccess = (message, title = "Success") => {
    setModal({
      type: "success",
      title,
      message
    });
  };

  const openError = (message, title = "Error") => {
    setModal({
      type: "error",
      title,
      message
    });
  };

  const openInfo = (message, title = "Info") => {
    setModal({
      type: "info",
      title,
      message
    });
  };

  return (
    <ModalContext.Provider
      value={{ openConfirm, openSuccess, openError, openInfo, closeModal }}
    >
      {children}

      {modal?.type === "confirm" && (
        <ConfirmModal 
          title={modal.title}
          message={modal.message}
          onConfirm={modal.onConfirm} 
          onClose={closeModal} 
        />
      )}

      {["success", "error", "info"].includes(modal?.type) && (
        <MessageModal 
          type={modal.type}
          title={modal.title}
          message={modal.message} 
          onClose={closeModal} 
        />
      )}
    </ModalContext.Provider>
  );
}

export const useModal = () => useContext(ModalContext);