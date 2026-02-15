import "../css/header.css";

function Header({ title }) {
  return (
    <header className="header">
      <div className="logo">
        {/* Replace with <img /> later */}
        <strong>REPLACE WITH LOGO IMAGE</strong> {/* this is a placeholder */}
      </div>

      <h1>{title}</h1>
    </header>
  );
}

export default Header;
