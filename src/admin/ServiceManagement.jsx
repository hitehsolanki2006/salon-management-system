import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useModal } from "../context/ModalContext";
import "./ServiceManagement.css";

export default function ServiceManagement() {
  const { openSuccess, openError, openConfirm } = useModal();

  const emptyForm = {
    name: "",
    description: "",
    price: "",
    duration: "",
    discount_percent: 0,
    discount_allowed: false,
    is_active: true,
    image_url: null
  };

  const [services, setServices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      openError("Failed to fetch services");
      return;
    }
    setServices(data || []);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const uploadImage = async (file) => {
    const ext = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const filePath = `services/${fileName}`;

    const { error } = await supabase.storage
      .from("service-images")
      .upload(filePath, file);

    if (error) return null;

    const { data } = supabase.storage
      .from("service-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const saveService = async () => {
    if (!form.name || !form.price || !form.duration) {
      openError("Name, price, and duration are required fields.");
      return;
    }

    setLoading(true);

    let imageUrl = form.image_url;

    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile);
      if (!uploadedUrl) {
        setLoading(false);
        openError("Image upload failed.");
        return;
      }
      imageUrl = uploadedUrl;
    }

    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      duration: Number(form.duration),
      discount_percent: form.discount_allowed ? Number(form.discount_percent) : 0,
      discount_allowed: form.discount_allowed,
      is_active: form.is_active,
      image_url: imageUrl
    };

    if (editingId) {
      // UPDATE LOGIC
      const { error } = await supabase.from("services").update(payload).eq("id", editingId);
      
      if (error) {
        openError(error.message);
      } else {
        openSuccess("Service updated successfully!");
        // ✅ AUTO-REFLECT: Update local state immediately
        setServices(services.map(s => s.id === editingId ? { ...s, ...payload } : s));
        resetForm();
      }
    } else {
      // INSERT LOGIC
      const { data, error } = await supabase.from("services").insert(payload).select();
      
      if (error) {
        openError(error.message);
      } else {
        openSuccess("New service added!");
        // ✅ AUTO-REFLECT: Add new item to top of list
        if (data) setServices([data[0], ...services]);
        resetForm();
      }
    }
    setLoading(false);
  };

  // const deleteService = (id) => {
  //   openConfirm({
  //     title: "Confirm Deletion",
  //     message: "Are you sure you want to delete this service permanently?",
  //     onConfirm: async () => {
  //       // ✅ Perform actual deletion in Supabase
  //       const { error } = await supabase.from("services").delete().eq("id", id);
        
  //       if (error) {
  //         openError("Could not delete service: " + error.message);
  //       } else {
  //         // ✅ AUTO-REFLECT: Remove from local state immediately
  //         setServices(prev => prev.filter(service => service.id !== id));
  //         openSuccess("Service deleted.");
  //       }
  //     }
  //   });
  // };

  const deleteService = async (id) => {
    // 1. Check if this service is linked to any non-completed/non-cancelled appointments
    const { data: linkedApps } = await supabase
      .from("appointment_services")
      .select(`
        appointment_id,
        appointments!inner ( status )
      `)
      .eq("service_id", id);

    // Filter to see if any linked appointment is NOT 'completed' or 'cancelled'
    const activeAppointments = linkedApps?.filter(item => 
      !['completed', 'cancelled'].includes(item.appointments.status)
    );

    if (activeAppointments && activeAppointments.length > 0) {
      // ❌ BLOCK DELETE: Service is busy
      openConfirm({
        title: "Service In Use",
        message: `This service has ${activeAppointments.length} pending appointments. You cannot delete it, but you can Deactivate it to hide it from customers. Deactivate now?`,
        onConfirm: async () => {
          const { error: updateError } = await supabase
            .from("services")
            .update({ is_active: false })
            .eq("id", id);

          if (updateError) {
            openError("Failed to deactivate service.");
          } else {
            // Auto-reflect in UI
            setServices(services.map(s => s.id === id ? { ...s, is_active: false } : s));
            openSuccess("Service deactivated and hidden.");
          }
        }
      });
      return;
    }

    // 2. If no active appointments, ask for permanent deletion
    openConfirm({
      title: "Confirm Permanent Delete",
      message: "This service has no active bookings. Delete it permanently from the database?",
      onConfirm: async () => {
        const { error: deleteError } = await supabase
          .from("services")
          .delete()
          .eq("id", id);
        
        if (deleteError) {
          // If it still fails due to historical data (completed apps)
          openError("Cannot delete due to historical records. Please use 'Active' toggle to hide it.");
        } else {
          setServices(prev => prev.filter(service => service.id !== id));
          openSuccess("Service deleted successfully.");
        }
      }
    });
  };
  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setImageFile(null);
  };

  // ... (FilteredServices and Return JSX remains same as your code)
  const filteredServices = services.filter((s) => {
    if (filter === "active" && !s.is_active) return false;
    if (filter === "disabled" && s.is_active) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  // return (
  //   <div className="service-management">
  //     <div className="management-header">
  //       <h3>Service Management</h3>
  //       <p>Add, edit, and manage salon services</p>
  //     </div>

  //     <div className="service-form-card">
  //       <h4>{editingId ? "✏️ Edit Service" : "✨ Add New Service"}</h4>

  //       <div className="form-grid">
  //         <div className="form-group">
  //           <label>Service Name *</label>
  //           <input
  //             type="text"
  //             placeholder="e.g., Haircut"
  //             value={form.name}
  //             onChange={(e) => setForm({ ...form, name: e.target.value })}
  //           />
  //         </div>

  //         <div className="form-group">
  //           <label>Price (₹) *</label>
  //           <input
  //             type="number"
  //             value={form.price}
  //             onChange={(e) => setForm({ ...form, price: e.target.value })}
  //           />
  //         </div>

  //         <div className="form-group">
  //           <label>Duration (min) *</label>
  //           <input
  //             type="number"
  //             value={form.duration}
  //             onChange={(e) => setForm({ ...form, duration: e.target.value })}
  //           />
  //         </div>

  //         <div className="form-group">
  //           <label>Discount (%)</label>
  //           <input
  //             type="number"
  //             value={form.discount_percent}
  //             disabled={!form.discount_allowed}
  //             onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
  //           />
  //         </div>

  //         <div className="form-group full-width">
  //           <label>Description</label>
  //           <textarea
  //             value={form.description}
  //             onChange={(e) => setForm({ ...form, description: e.target.value })}
  //             rows="2"
  //           />
  //         </div>

  //         <div className="form-group full-width">
  //           <label>Image File</label>
  //           <input
  //             type="file"
  //             accept="image/*"
  //             onChange={(e) => setImageFile(e.target.files[0])}
  //           />
  //         </div>

  //         <div className="form-checkboxes">
  //           <label className="checkbox-label">
  //             <input
  //               type="checkbox"
  //               checked={form.discount_allowed}
  //               onChange={(e) => setForm({ ...form, discount_allowed: e.target.checked })}
  //             />
  //             <span>Allow Discount</span>
  //           </label>

  //           <label className="checkbox-label">
  //             <input
  //               type="checkbox"
  //               checked={form.is_active}
  //               onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
  //             />
  //             <span>Active</span>
  //           </label>
  //         </div>
  //       </div>

  //       <div className="form-actions">
  //         <button className="btn-save" onClick={saveService} disabled={loading}>
  //           {loading ? "Saving..." : editingId ? "Update Service" : "Add Service"}
  //         </button>
  //         {editingId && <button className="btn-cancel" onClick={resetForm}>Cancel</button>}
  //       </div>
  //     </div>

  //     <div className="filter-bar">
  //       <input
  //         className="search-input"
  //         placeholder="🔍 Search services..."
  //         value={search}
  //         onChange={(e) => setSearch(e.target.value)}
  //       />
  //       <select value={filter} onChange={(e) => setFilter(e.target.value)}>
  //         <option value="all">All</option>
  //         <option value="active">Active</option>
  //         <option value="disabled">Inactive</option>
  //       </select>
  //     </div>

  //     <div className="service-list">
  //       {filteredServices.map((s) => (
  //         <div key={s.id} className="service-item">
  //           <div className="service-image-wrapper">
  //             {s.image_url ? <img src={s.image_url} alt={s.name} /> : <div className="no-image">No Image</div>}
  //             {!s.is_active && <div className="inactive-badge">Inactive</div>}
  //           </div>

  //           <div className="service-info">
  //             <h4>{s.name}</h4>
  //             <div className="service-meta">
  //               <span className="price">₹{s.price}</span>
  //               <span className="duration">⏱️ {s.duration} min</span>
  //             </div>
  //           </div>

  //           <div className="service-actions">
  //             <button className="btn-edit" onClick={() => { setEditingId(s.id); setForm(s); }}>✏️</button>
  //             <button className="btn-delete" onClick={() => deleteService(s.id)}>🗑️</button>
  //           </div>
  //         </div>
  //       ))}
  //     </div>
  //   </div>
  // );

  // ... (imports and logic remain the same)

  return (
    <div className="service-management">
      <div className="management-header">
        <div className="header-text">
          <h3>Service Management</h3>
          <p>Curate and manage your salon's premium offerings</p>
        </div>
      </div>

      <div className="analytics-card service-form-card">
        <div className="card-header">
          <h4>{editingId ? "✏️ Edit Service" : "✨ Add New Offering"}</h4>
        </div>

        <div className="form-grid-royal">
          <div className="form-group-royal">
            <label>Service Name *</label>
            <input
              type="text"
              placeholder="e.g., Royal Facial"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="form-group-royal">
            <label>Price (₹) *</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>

          <div className="form-group-royal">
            <label>Duration (min) *</label>
            <input
              type="number"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
            />
          </div>

          <div className="form-group-royal">
            <label>Discount (%)</label>
            <input
              type="number"
              value={form.discount_percent}
              disabled={!form.discount_allowed}
              onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
            />
          </div>

          <div className="form-group-royal full-width">
            <label>Description</label>
            <textarea
              placeholder="Describe the luxury experience..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows="2"
            />
          </div>

          <div className="form-group-royal full-width">
            <label>Service Image</label>
            <div className="file-input-wrapper">
               <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
              />
              {imageFile && <span className="file-name">📍 {imageFile.name}</span>}
            </div>
          </div>

          <div className="form-checkbox-row">
            <label className="royal-checkbox">
              <input
                type="checkbox"
                checked={form.discount_allowed}
                onChange={(e) => setForm({ ...form, discount_allowed: e.target.checked })}
              />
              <span>Enable Discount</span>
            </label>

            <label className="royal-checkbox">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              <span>Active on Menu</span>
            </label>
          </div>
        </div>

        <div className="form-actions-royal">
          <button className="btn-save-royal" onClick={saveService} disabled={loading}>
            {loading ? "Syncing..." : editingId ? "Update Service" : "Launch Service"}
          </button>
          {editingId && <button className="btn-cancel-royal" onClick={resetForm}>Cancel</button>}
        </div>
      </div>

      <div className="filter-bar-royal">
        <div className="search-wrapper">
          <input
            className="search-input-royal"
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select-royal" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Services</option>
          <option value="active">Active Only</option>
          <option value="disabled">Hidden/Inactive</option>
        </select>
      </div>

      <div className="service-list-grid">
        {filteredServices.map((s) => (
          <div key={s.id} className={`service-item-card ${!s.is_active ? "is-hidden" : ""}`}>
            <div className="service-img-container">
              {s.image_url ? (
                <img src={s.image_url} alt={s.name} className="service-img" />
              ) : (
                <div className="service-img-placeholder">✨</div>
              )}
              {!s.is_active && <div className="hidden-overlay">INACTIVE</div>}
            </div>

            <div className="service-details">
              <h4>{s.name}</h4>
              {s.description && (
                <p className="service-description">{s.description}</p>
              )}
              <div className="service-pricing">
                <span className="royal-price">₹{s.price}</span>
                <span className="royal-duration">⏱️ {s.duration} min</span>
              </div>
            </div>

            <div className="service-item-actions">
              <button className="icon-btn edit" onClick={() => { setEditingId(s.id); setForm(s); window.scrollTo(0,0); }}>✏️</button>
              <button className="icon-btn delete" onClick={() => deleteService(s.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

}