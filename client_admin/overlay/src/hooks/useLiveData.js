import { useState, useEffect } from "react";

const useLiveData = () => {
  const [data, setData] = useState({
    team: Array(6).fill(null),
    badges: Array(8).fill(false),
    location: "Unknown",
    events: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/live.json");
        if (response.ok) {
          const jsonData = await response.json();
          setData(jsonData);
        }
      } catch (error) {
        console.error("Error fetching live data:", error);
      }
    };

    // Initial fetch
    fetchData();

    // Poll every 500ms
    const intervalId = setInterval(fetchData, 500);

    return () => clearInterval(intervalId);
  }, []);

  return data;
};

export default useLiveData;
