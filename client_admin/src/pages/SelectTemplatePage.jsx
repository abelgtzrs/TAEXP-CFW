import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { Plus } from "lucide-react";

const SelectTemplatePage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        // Fetch the list of workout templates from our backend.
        const response = await api.get("/workout-templates");
        setTemplates(response.data.data);
      } catch (err) {
        setError("Failed to load workout templates.");
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  if (loading) return <p className="text-text-secondary">Loading templates...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="pb-20 md:pb-0">
      <h1 className="text-3xl font-bold text-primary mb-6">Select a Prebuilt Workout</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create New Template Card */}
        <Link
          to="/admin/templates"
          className="p-6 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-white/5 transition-all duration-300 group min-h-[200px]"
        >
          <div className="p-4 rounded-full bg-white/5 group-hover:bg-primary/20 mb-4 transition-colors text-white group-hover:text-primary">
            <Plus size={32} />
          </div>
          <h2 className="text-xl font-bold text-white group-hover:text-primary transition-colors">Create New Template</h2>
          <p className="text-text-secondary text-sm mt-2">Design a new reusable workout routine</p>
        </Link>

        {templates.map((template) => (
          // This Link navigates to the logging page.
          // The 'state' prop is a powerful feature of React Router for passing
          // complex data to the next page without using URL parameters.
          <Link
            key={template._id}
            to="/workouts/log"
            state={{ templateData: template }} // Passing the chosen template data
            className="p-6 rounded-xl border border-white/10 bg-surface hover:bg-white/5 transition-all duration-300 block group"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
          >
            <h2 className="text-xl font-bold text-white group-hover:text-primary transition-colors mb-2">{template.name}</h2>
            <p className="text-text-secondary text-sm mb-4 line-clamp-2">{template.description}</p>
            <ul className="text-xs text-text-main list-disc list-inside space-y-1">
              {/* Display the names of the exercises in the template */}
              {template.exercises.slice(0, 5).map((ex) => (
                <li key={ex._id} className="truncate">{ex.name}</li>
              ))}
              {template.exercises.length > 5 && (
                <li className="list-none text-text-secondary italic pl-2">+ {template.exercises.length - 5} more</li>
              )}
            </ul>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SelectTemplatePage;
