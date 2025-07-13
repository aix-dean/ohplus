const LogisticsReportPage = () => {
  return (
    <div>
      {/* Header */}
      <header className="bg-slate-800 text-white p-4">
        <h1 className="text-2xl font-bold">Logistics Report</h1>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <p>This is the logistics report page. Report ID: [id]</p>
        {/* Add report content here */}
      </main>

      {/* Footer */}
      <div className="relative h-16 mt-8 overflow-hidden">
        {/* Cyan section */}
        <div className="absolute inset-0 bg-cyan-400"></div>

        {/* Dark blue section with angular cut */}
        <div
          className="absolute inset-0 bg-slate-800"
          style={{
            clipPath: "polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)",
          }}
        ></div>

        {/* Content */}
        <div className="relative h-full flex items-center justify-between px-8">
          {/* Left side - Company info */}
          <div className="text-slate-800 font-medium">
            <span>© 2025 GTS Digital Outdoor Solutions</span>
          </div>

          {/* Right side - Branding */}
          <div className="flex items-center gap-4 text-white">
            <span className="font-medium">Smart. Seamless. Scalable</span>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold">OH!</span>
              <div className="w-6 h-6 flex items-center justify-center">
                <div className="w-4 h-0.5 bg-cyan-400"></div>
                <div className="w-0.5 h-4 bg-cyan-400 absolute"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LogisticsReportPage
