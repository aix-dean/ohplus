export default function CMSTestPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">CMS Test Page</h1>
      <p>This page should load if CMS routing works correctly.</p>
      <p>Current time: {new Date().toISOString()}</p>
    </div>
  )
}
