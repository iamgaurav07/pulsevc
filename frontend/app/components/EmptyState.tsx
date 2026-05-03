type EmptyStateProps = {
  icon: string
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      className="fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 32px",
        textAlign: "center",
        background: "var(--bg-card)",
        border: "2px dashed var(--border)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <div style={{
        width: "72px", height: "72px",
        background: "var(--accent-light)",
        borderRadius: "20px",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "32px",
        marginBottom: "20px",
        border: "1px solid rgba(99,102,241,0.15)",
        boxShadow: "0 4px 16px rgba(99,102,241,0.1)",
      }}>
        {icon}
      </div>
      <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px", color: "var(--text-primary)" }}>
        {title}
      </h3>
      <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "360px", lineHeight: "1.6", marginBottom: action ? "24px" : "0" }}>
        {description}
      </p>
      {action}
    </div>
  )
}