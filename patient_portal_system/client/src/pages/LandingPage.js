import { Link } from "react-router-dom";

const LandingPage = ({ apiCall }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-blue-100">
      <h1 className="text-4xl font-bold mb-6">Welcome to Our Healthcare System</h1>
      <p className="text-lg mb-4">We manage health.</p>

      {/* Button to navigate to Login Page */}
      <Link
        to="/login"
        className="bg-blue-500 text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-600 transition"
      >
        Get Started
      </Link>

      {/* Button to make an API call */}
      <button
        onClick={apiCall}
        className="mt-4 bg-green-500 text-white px-6 py-3 rounded-lg text-lg hover:bg-green-600 transition"
      >
        Make API Call
      </button>
    </div>
  );
};

export default LandingPage;
