type NavbarProps = {
  title: string;
  onMenuClick: () => void;
};

export const Navbar = ({ title, onMenuClick }: NavbarProps) => {
  return (
    <header className="navbar">
      <button className="icon-button" onClick={onMenuClick} type="button">
        <span className="hamburger">
          <span />
          <span />
          <span />
        </span>
      </button>
      <div className="navbar__title">
        <h1>{title}</h1>
        <p>BakersField by Rashmi</p>
      </div>
      <span className="navbar__spacer" aria-hidden="true" />
    </header>
  );
};
