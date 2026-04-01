export default function Avatar({ name, avatarUrl, size = 40 }) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: avatarUrl ? "transparent" : "linear-gradient(135deg, #6A0DAD, #9B59B6)",
        color: "#FFD700",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        fontSize: size > 60 ? `${size / 3}px` : `${size / 2.5}px`,
        overflow: "hidden",
        border: "3px solid #FFD700",
        boxShadow: "0 4px 15px rgba(106, 13, 173, 0.4)",
        flexShrink: 0
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name || "User avatar"}
          style={{ 
            width: "100%", 
            height: "100%", 
            objectFit: "cover"
          }}
          onError={(e) => {
            e.target.style.display = "none";
            e.target.parentElement.style.background = "linear-gradient(135deg, #6A0DAD, #9B59B6)";
            e.target.parentElement.textContent = initials;
          }}
        />
      ) : (
        initials
      )}
    </div>
  );
}
