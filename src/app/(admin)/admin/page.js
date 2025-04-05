// this is the page with the auth
// where the admin can login
'use client'
import useAuthStore from "../../../stores/authStore"
import AdminLogin from "../../components/admin/AdminLogin"
import AdminListings from "../../components/admin/AdminListings"

export default function AdminPage() {

  const { user, token, isAuthenticated } = useAuthStore((state) => state)
  const authenticated = user && token && isAuthenticated

  return (
    <>
      {authenticated ? (
        <AdminListings />
      ) : (
        <AdminLogin />
      )}
    </>
  );
}