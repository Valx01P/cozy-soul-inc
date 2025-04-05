
export default function AdminLogin() {

  return (
    <div className="flex-col-center h-[55rem] bg-gray-400">
      <div>
        <div>
          <h1>Secure Login</h1>
        </div>
        <div>
          <form>
            <div className="mb-4">
              <label htmlFor="username" className="block text-gray-700">Username</label>
              <input type="text" id="username" name="username" required className="border rounded w-full py-2 px-3 text-gray-700" />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700">Password</label>
              <input type="password" id="password" name="password" required className="border rounded w-full py-2 px-3 text-gray-700" />
            </div>
            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Login</button>
          </form>
        </div>
      </div>
    </div>
  )
}