import { Link } from "react-router-dom";

const LoginPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Login</h1>
      <p className="text-lg mb-4">Enter your credentials below:</p>

      <input
        type="email"
        placeholder="Email"
        className="border p-2 mb-2 w-64"
      />
      <input
        type="password"
        placeholder="Password"
        className="border p-2 mb-4 w-64"
      />
      <button className="bg-blue-500 text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-600 transition">
        Login
      </button>

      {/* Back to Landing Page */}
      <Link to="/" className="mt-4 text-blue-500 hover:underline">
        Back to Home
      </Link>
    </div>
  );
};

export default LoginPage;
