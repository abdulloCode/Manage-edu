import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Unauthorized() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-error">403</h1>
        <p className="text-xl font-semibold mt-2">Access Denied</p>
        <p className="text-base-content/60 mt-1 mb-6">You don't have permission to view this page.</p>

        {/* Debug Info */}
        <div className="bg-base-100 rounded-2xl p-4 mb-6 text-left max-w-md mx-auto">
          <h3 className="font-bold text-sm mb-2 text-base-content/70">Debug Information:</h3>
          <div className="text-xs space-y-1">
            <p><strong>Is Authenticated:</strong> {isAuthenticated ? "Yes" : "No"}</p>
            <p><strong>User Role:</strong> {user?.role || "Not found"}</p>
            <p><strong>User Name:</strong> {user?.name || "Not found"}</p>
            <p><strong>User Email:</strong> {user?.email || "Not found"}</p>
            <p><strong>User ID:</strong> {user?.id || user?._id || "Not found"}</p>
            <p><strong>Full User:</strong></p>
            <pre className="bg-base-200 p-2 rounded text-xs overflow-auto max-h-32">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    </div>
  )
}
