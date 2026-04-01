import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function useServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true);

      if (!error) setServices(data);
      setLoading(false);
    };

    fetchServices();
  }, []);

  return { services, loading };
}
