// this is the page with the auth
// where the admin can login

export default function AdminPage() {

  let isAdmin = true; // This should be replaced with actual authentication logic

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {isAdmin ? (
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to the Admin Panel</h1>
          <p className="text-lg text-gray-600">You have successfully logged in as an admin.</p>
        </div>
      ) : (
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Admin Login</h1>
          <p className="text-lg text-gray-600">Please log in to access the admin panel.</p>
          {/* Add your login form here */}
        </div>
      )}
    </div>
  );
}